using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.RegularExpressions;
using Serilog;

namespace AMT.Core.GameData;

public class ItemDatabase
{
    private static readonly Lazy<ItemDatabase> _instance = new(() => new ItemDatabase());
    public static ItemDatabase Instance => _instance.Value;

    private readonly ConcurrentDictionary<string, ItemInfo> _items = new(StringComparer.OrdinalIgnoreCase);

    public ItemDatabase()
    {
        InitializeCommonItems();
    }

    public ItemInfo GetOrCreate(string uniqueName)
    {
        if (string.IsNullOrWhiteSpace(uniqueName))
            return new ItemInfo { UniqueName = "UNKNOWN", DisplayName = "Unknown Item" };

        return _items.GetOrAdd(uniqueName, name =>
        {
            var tier = ExtractTier(name);
            var enchant = ExtractEnchantment(name);
            var displayName = FormatDisplayName(name, tier, enchant);

            return new ItemInfo
            {
                UniqueName = name,
                DisplayName = displayName,
                Tier = tier,
                Enchantment = enchant
            };
        });
    }

    public string GetDisplayName(string uniqueName) => GetOrCreate(uniqueName).DisplayName;

    public static int ExtractTier(string uniqueName)
    {
        if (string.IsNullOrEmpty(uniqueName)) return 1;
        var match = Regex.Match(uniqueName, @"^T([1-8])_");
        return match.Success ? int.Parse(match.Groups[1].Value) : 1;
    }

    public static int ExtractEnchantment(string uniqueName)
    {
        if (string.IsNullOrEmpty(uniqueName)) return 0;
        var match = Regex.Match(uniqueName, @"@([1-4])$");
        return match.Success ? int.Parse(match.Groups[1].Value) : 0;
    }

    public static string FormatDisplayName(string uniqueName, int tier, int enchantment)
    {
        // Strip tier prefix and enchantment suffix
        var baseName = Regex.Replace(uniqueName, @"^T[1-8]_", "");
        baseName = Regex.Replace(baseName, @"@[1-4]$", "");

        // Convert SNAKE_CASE to Title Case words
        var words = baseName.Split('_', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpperInvariant(w[0]) + (w.Length > 1 ? w[1..].ToLowerInvariant() : ""));
        var cleanName = string.Join(" ", words);

        var tierPrefix = tier switch
        {
            1 => "Beginner's",
            2 => "Novice's",
            3 => "Journeyman's",
            4 => "Adept's",
            5 => "Expert's",
            6 => "Master's",
            7 => "Grandmaster's",
            8 => "Elder's",
            _ => $"T{tier}"
        };

        var enchantSuffix = enchantment > 0 ? $" .{enchantment}" : "";
        return $"{tierPrefix} {cleanName}{enchantSuffix}";
    }

    private void InitializeCommonItems()
    {
        // Pre-populate with popular resources & equipment
        Register("T4_BAG", "Adept's Bag", 4, 0, "Bag");
        Register("T5_BAG", "Expert's Bag", 5, 0, "Bag");
        Register("T6_BAG", "Master's Bag", 6, 0, "Bag");
        Register("T7_BAG", "Grandmaster's Bag", 7, 0, "Bag");
        Register("T8_BAG", "Elder's Bag", 8, 0, "Bag");

        Register("T4_CAPE", "Adept's Cape", 4, 0, "Cape");
        Register("T5_CAPE", "Expert's Cape", 5, 0, "Cape");
        Register("T6_CAPE", "Master's Cape", 6, 0, "Cape");
        Register("T7_CAPE", "Grandmaster's Cape", 7, 0, "Cape");
        Register("T8_CAPE", "Elder's Cape", 8, 0, "Cape");

        Register("T4_MOUNT_HORSE", "Adept's Riding Horse", 4, 0, "Mount");
        Register("T5_MOUNT_HORSE", "Expert's Riding Horse", 5, 0, "Mount");
        Register("T6_MOUNT_HORSE", "Master's Riding Horse", 6, 0, "Mount");
        Register("T7_MOUNT_HORSE", "Grandmaster's Riding Horse", 7, 0, "Mount");
        Register("T8_MOUNT_HORSE", "Elder's Riding Horse", 8, 0, "Mount");

        Register("T4_MOUNT_OX", "Adept's Transport Ox", 4, 0, "Mount");
        Register("T5_MOUNT_OX", "Expert's Transport Ox", 5, 0, "Mount");
        Register("T6_MOUNT_OX", "Master's Transport Ox", 6, 0, "Mount");
        Register("T7_MOUNT_OX", "Grandmaster's Transport Ox", 7, 0, "Mount");
        Register("T8_MOUNT_OX", "Elder's Transport Ox", 8, 0, "Mount");

        Register("T4_ORE", "Iron Ore", 4, 0, "Resource");
        Register("T5_ORE", "Titanium Ore", 5, 0, "Resource");
        Register("T6_ORE", "Runite Ore", 6, 0, "Resource");
        Register("T7_ORE", "Meteorite Ore", 7, 0, "Resource");
        Register("T8_ORE", "Adamantium Ore", 8, 0, "Resource");

        Register("T4_BAR", "Bronze Bar", 4, 0, "Refined Resource");
        Register("T5_BAR", "Steel Bar", 5, 0, "Refined Resource");
        Register("T6_BAR", "Titanium Steel Bar", 6, 0, "Refined Resource");
        Register("T7_BAR", "Runite Steel Bar", 7, 0, "Refined Resource");
        Register("T8_BAR", "Adamantine Bar", 8, 0, "Refined Resource");
    }

    private void Register(string uniqueName, string displayName, int tier, int enchant, string category)
    {
        _items[uniqueName] = new ItemInfo
        {
            UniqueName = uniqueName,
            DisplayName = displayName,
            Tier = tier,
            Enchantment = enchant,
            Category = category
        };
    }
}
