namespace AMT.Core.GameData;

public static class LocationResolver
{
    public static string Resolve(string? clusterIdOrName)
    {
        var resolved = WorldDataManager.Instance.Resolve(clusterIdOrName);
        return resolved.DisplayName;
    }

    public static ResolvedCluster ResolveDetails(string? clusterIdOrName)
    {
        return WorldDataManager.Instance.Resolve(clusterIdOrName);
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
