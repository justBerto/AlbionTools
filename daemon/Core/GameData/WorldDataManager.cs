using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Serilog;

namespace AMT.Core.GameData;

public class WorldJsonObject
{
    [JsonPropertyName("@id")]
    public string? Index { get; set; }

    [JsonPropertyName("@displayname")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("@type")]
    public string? Type { get; set; }

    [JsonPropertyName("@file")]
    public string? File { get; set; }

    [JsonPropertyName("@enabled")]
    public string? Enabled { get; set; }
}

public class ResolvedCluster
{
    public string ClusterIndex { get; set; } = "";
    public string DisplayName { get; set; } = "Unknown Location";
    public string Tier { get; set; } = "T0";
    public string Danger { get; set; } = "Blue";

    public override string ToString() => $"{Tier} {DisplayName} ({Danger} Zone)";
}

public class WorldDataManager
{
    private static readonly Lazy<WorldDataManager> _lazy = new(() => new WorldDataManager());
    public static WorldDataManager Instance => _lazy.Value;

    private readonly Dictionary<string, WorldJsonObject> _clusters = new(StringComparer.OrdinalIgnoreCase);

    public int TotalClustersLoaded => _clusters.Count;

    private WorldDataManager()
    {
        LoadWorldData();
    }

    private void LoadWorldData()
    {
        try
        {
            string? jsonContent = null;

            // 1. Try reading from disk
            string localPath = Path.Combine(AppContext.BaseDirectory, "Data", "world-modified.json");
            if (File.Exists(localPath))
            {
                jsonContent = File.ReadAllText(localPath);
            }
            else
            {
                // Fallback to relative workspace path
                string relativePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "world-modified.json");
                if (File.Exists(relativePath))
                {
                    jsonContent = File.ReadAllText(relativePath);
                }
            }

            // 2. Try embedded resource
            if (string.IsNullOrWhiteSpace(jsonContent))
            {
                var assembly = Assembly.GetExecutingAssembly();
                string resourceName = "AlbionTools.Daemon.Data.world-modified.json";
                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream != null)
                {
                    using var reader = new StreamReader(stream);
                    jsonContent = reader.ReadToEnd();
                }
            }

            if (!string.IsNullOrWhiteSpace(jsonContent))
            {
                var list = JsonSerializer.Deserialize<List<WorldJsonObject>>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (list != null)
                {
                    foreach (var obj in list)
                    {
                        if (!string.IsNullOrWhiteSpace(obj.Index))
                        {
                            _clusters[obj.Index.Trim()] = obj;
                        }
                    }
                    Log.Information("WorldDataManager loaded {Count} clusters from world data", _clusters.Count);
                }
            }
            else
            {
                Log.Warning("WorldDataManager could not locate world-modified.json");
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to load world data in WorldDataManager");
        }
    }

    public ResolvedCluster Resolve(string? rawClusterIdOrName)
    {
        if (string.IsNullOrWhiteSpace(rawClusterIdOrName))
        {
            return new ResolvedCluster { DisplayName = "Unknown Location", Tier = "T0", Danger = "Blue" };
        }

        var key = rawClusterIdOrName.Trim();

        // 1. Direct match by Index
        if (_clusters.TryGetValue(key, out var worldObj))
        {
            return BuildResolvedCluster(key, worldObj);
        }

        // 2. Handle special compound IDs like @ISLAND@guid or @RANDOMDUNGEON@guid or 0000-HellDen
        if (key.Contains('@'))
        {
            var parts = key.Split('@', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 0)
            {
                var prefix = parts[0].ToUpperInvariant();
                if (prefix.Contains("ISLAND"))
                {
                    return new ResolvedCluster { ClusterIndex = key, DisplayName = "Player Island", Tier = "T3", Danger = "Blue" };
                }
                if (prefix.Contains("RANDOMDUNGEON"))
                {
                    return new ResolvedCluster { ClusterIndex = key, DisplayName = "Random Dungeon", Tier = "T5", Danger = "Blue" };
                }
                if (prefix.Contains("CORRUPTED"))
                {
                    return new ResolvedCluster { ClusterIndex = key, DisplayName = "Corrupted Dungeon", Tier = "T5", Danger = "Yellow" };
                }
                if (prefix.Contains("HELLGATE"))
                {
                    return new ResolvedCluster { ClusterIndex = key, DisplayName = "Hellgate", Tier = "T6", Danger = "Red" };
                }
                if (prefix.Contains("MISTS"))
                {
                    return new ResolvedCluster { ClusterIndex = key, DisplayName = "The Mists", Tier = "T6", Danger = "Mists" };
                }
                if (prefix.Contains("HIDEOUT") && parts.Length >= 2 && _clusters.TryGetValue(parts[1], out var parentObj))
                {
                    return new ResolvedCluster { ClusterIndex = key, DisplayName = $"Hideout ({parentObj.DisplayName})", Tier = ExtractTier(parentObj.File), Danger = "Black" };
                }
            }
        }

        // 3. Match by DisplayName
        var byName = _clusters.Values.FirstOrDefault(x => string.Equals(x.DisplayName, key, StringComparison.OrdinalIgnoreCase));
        if (byName != null)
        {
            return BuildResolvedCluster(byName.Index ?? key, byName);
        }

        // 4. Fallback defaults for legacy or unknown
        return new ResolvedCluster
        {
            ClusterIndex = key,
            DisplayName = key,
            Tier = "T0",
            Danger = "Blue"
        };
    }

    private static ResolvedCluster BuildResolvedCluster(string index, WorldJsonObject obj)
    {
        var tier = ExtractTier(obj.File);
        var danger = ExtractDanger(obj.Type);
        var name = !string.IsNullOrWhiteSpace(obj.DisplayName) ? obj.DisplayName : index;

        return new ResolvedCluster
        {
            ClusterIndex = index,
            DisplayName = name,
            Tier = tier,
            Danger = danger
        };
    }

    private static string ExtractTier(string? file)
    {
        if (string.IsNullOrEmpty(file)) return "T0";
        if (file.Contains("_T1_")) return "T1";
        if (file.Contains("_T2_")) return "T2";
        if (file.Contains("_T3_")) return "T3";
        if (file.Contains("_T4_")) return "T4";
        if (file.Contains("_T5_")) return "T5";
        if (file.Contains("_T6_")) return "T6";
        if (file.Contains("_T7_")) return "T7";
        if (file.Contains("_T8_")) return "T8";
        return "T0";
    }

    private static string ExtractDanger(string? type)
    {
        if (string.IsNullOrEmpty(type)) return "Blue";
        var upper = type.ToUpperInvariant();

        if (upper.Contains("TUNNEL")) return "Avalon";
        if (upper.Contains("MISTS")) return "Mists";
        if (upper.Contains("BLACK")) return "Black";
        if (upper.Contains("RED")) return "Red";
        if (upper.Contains("YELLOW")) return "Yellow";
        if (upper.Contains("SAFEAREA") || upper.Contains("PLAYERCITY") || upper.Contains("STARTINGCITY") || upper.Contains("ISLAND") || upper == "HIDEOUT")
            return "Blue";

        return "Blue";
    }
}
