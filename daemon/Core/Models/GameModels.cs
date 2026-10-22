using AMT.Core.GameData;

namespace AMT.Core.Models;

/// <summary>
/// Represents a marketplace offer/order captured from network traffic.
/// The server sends these as JSON strings within Photon parameters.
/// </summary>
public class MarketOffer
{
    private int _tier;
    private int _enchantmentLevel;

    public long Id { get; set; }
    public long UnitPriceSilver { get; set; }
    public long TotalPriceSilver { get; set; }
    public int Amount { get; set; }
    public int Tier
    {
        get => _tier > 0 ? _tier : ItemDatabase.ExtractTier(ItemTypeId);
        set => _tier = value;
    }
    public bool IsFinished { get; set; }
    public string AuctionType { get; set; } = "";
    public string SellerName { get; set; } = "";
    public string ItemTypeId { get; set; } = "";
    public string ItemGroupTypeId { get; set; } = "";
    public int EnchantmentLevel
    {
        get => _enchantmentLevel > 0 ? _enchantmentLevel : ItemDatabase.ExtractEnchantment(ItemTypeId);
        set => _enchantmentLevel = value;
    }
    public int QualityLevel { get; set; } = 1;
    public DateTime Expires { get; set; }

    // Computed fields
    public string Location { get; set; } = "";
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
    public string OfferType { get; set; } = "sell_order"; // "sell_order" or "buy_order"

    /// <summary>
    /// Returns unit price in display silver (the internal value is ×10000).
    /// </summary>
    public long DisplayUnitPrice => UnitPriceSilver / 10000;
    public long DisplayTotalPrice => TotalPriceSilver / 10000;
}

/// <summary>
/// Represents a loot pickup event captured from network traffic.
/// </summary>
public class LootEntry
{
    public int Id { get; set; }
    public int? SessionId { get; set; }
    public string ItemUniqueName { get; set; } = "";
    public int ItemIndex { get; set; }
    public int Quantity { get; set; }
    public bool IsSilver { get; set; }
    public long SilverAmount { get; set; }
    public int ObjectId { get; set; }
    public string CurrentLocation { get; set; } = "";
    public string LootedFrom { get; set; } = "";
    public string LootedBy { get; set; } = "";
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;

    public long DisplaySilver => SilverAmount / 10000;
}

/// <summary>
/// Represents a silver transaction (silver picked up from kills/mobs).
/// </summary>
public class SilverTransaction
{
    public int Id { get; set; }
    public int? SessionId { get; set; }
    public long YieldPreTax { get; set; }
    public long YieldAfterTax { get; set; }
    public long ClusterTax { get; set; }
    public long GuildTax { get; set; }
    public bool IsPremium { get; set; }
    public double Multiplier { get; set; }
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;

    public long DisplayYieldPreTax => YieldPreTax / 10000;
    public long DisplayYieldAfterTax => YieldAfterTax / 10000;
}

/// <summary>
/// Represents a price history snapshot for trend analysis.
/// </summary>
public class PriceSnapshot
{
    public int Id { get; set; }
    public string ItemUniqueName { get; set; } = "";
    public string Location { get; set; } = "";
    public int QualityLevel { get; set; } = 1;
    public long SellPriceMin { get; set; }
    public long SellPriceMax { get; set; }
    public long BuyPriceMin { get; set; }
    public long BuyPriceMax { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Represents a tracking session.
/// </summary>
public class GameSession
{
    public int Id { get; set; }
    public string PlayerName { get; set; } = "";
    public string Server { get; set; } = "";
    public string CurrentLocation { get; set; } = "";
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public long TotalSilverEarned { get; set; }
    public int TotalItemsLooted { get; set; }
}

/// <summary>
/// Represents a chest opening event.
/// </summary>
public class ChestOpeningEvent
{
    public int ObjectId { get; set; }
    public string ChestType { get; set; } = "";
    public string Category { get; set; } = "Open World";
    public string Rarity { get; set; } = "green";
    public string Location { get; set; } = "";
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
}
