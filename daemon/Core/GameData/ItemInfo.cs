namespace AMT.Core.GameData;

public class ItemInfo
{
    public string UniqueName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int Tier { get; set; } = 1;
    public int Enchantment { get; set; } = 0;
    public string Category { get; set; } = "General";
    public int ItemValue { get; set; }

    public string IconUrl => $"https://render.albiononline.com/v1/item/{UniqueName}.png";
}
