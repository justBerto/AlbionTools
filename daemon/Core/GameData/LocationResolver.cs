namespace AMT.Core.GameData;

public static class LocationResolver
{
    private static readonly Dictionary<string, string> ClusterMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "0004", "Thetford" },
        { "0007", "Thetford Portal" },
        { "1002", "Lymhurst" },
        { "1006", "Lymhurst Portal" },
        { "2000", "Bridgewatch" },
        { "2004", "Bridgewatch Portal" },
        { "3003", "Caerleon" },
        { "3005", "Black Market" },
        { "3008", "Martlock" },
        { "3013", "Martlock Portal" },
        { "4002", "Fort Sterling" },
        { "4006", "Fort Sterling Portal" },
        { "5000", "Brecilien" },
        { "0001", "Swamp Cross" },
        { "1000", "Forest Cross" },
        { "2002", "Steppe Cross" },
        { "3000", "Highland Cross" },
        { "4000", "Mountain Cross" },
        { "Arthur's Rest", "Arthur's Rest" },
        { "Merlyn's Rest", "Merlyn's Rest" },
        { "Morgana's Rest", "Morgana's Rest" }
    };

    public static string Resolve(string? clusterIdOrName)
    {
        if (string.IsNullOrWhiteSpace(clusterIdOrName))
            return "Unknown Location";

        if (ClusterMap.TryGetValue(clusterIdOrName.Trim(), out var resolved))
            return resolved;

        // Clean cluster name if it looks like "ThetfordMarket" or similar
        var clean = clusterIdOrName.Replace("Market", "").Replace("Portal", "").Trim();
        return string.IsNullOrEmpty(clean) ? clusterIdOrName : clean;
    }

    public static string CanonicalCity(string location)
    {
        if (location.Contains("Thetford", StringComparison.OrdinalIgnoreCase)) return "Thetford";
        if (location.Contains("Lymhurst", StringComparison.OrdinalIgnoreCase)) return "Lymhurst";
        if (location.Contains("Bridgewatch", StringComparison.OrdinalIgnoreCase)) return "Bridgewatch";
        if (location.Contains("Martlock", StringComparison.OrdinalIgnoreCase)) return "Martlock";
        if (location.Contains("Fort Sterling", StringComparison.OrdinalIgnoreCase)) return "Fort Sterling";
        if (location.Contains("Caerleon", StringComparison.OrdinalIgnoreCase)) return "Caerleon";
        if (location.Contains("Brecilien", StringComparison.OrdinalIgnoreCase)) return "Brecilien";
        if (location.Contains("Black Market", StringComparison.OrdinalIgnoreCase)) return "Black Market";
        return location;
    }
}
