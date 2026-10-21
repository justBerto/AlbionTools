using System.Net;

namespace AMT.Core.Capture;

public enum AlbionServerRegion
{
    Unknown,
    Americas,
    Asia,
    Europe
}

public static class ServerDetectionService
{
    public static AlbionServerRegion DetectRegion(IPAddress ipAddress)
    {
        var bytes = ipAddress.GetAddressBytes();
        if (bytes.Length != 4) return AlbionServerRegion.Unknown;

        byte b0 = bytes[0];
        byte b1 = bytes[1];

        // Known IP ranges for Albion Online clusters
        if (b0 == 193 && b1 == 169) return AlbionServerRegion.Americas;
        if (b0 == 5 && b1 == 188) return AlbionServerRegion.Americas;
        if (b0 == 5 && b1 == 45) return AlbionServerRegion.Asia;
        if (b0 == 185 && b1 == 107) return AlbionServerRegion.Asia;
        if (b0 == 185 && b1 == 225) return AlbionServerRegion.Europe;
        if (b0 == 194 && b1 == 61) return AlbionServerRegion.Europe;

        return AlbionServerRegion.Unknown;
    }

    public static string GetRegionName(AlbionServerRegion region) => region switch
    {
        AlbionServerRegion.Americas => "Albion Americas (Washington)",
        AlbionServerRegion.Asia => "Albion Asia (Singapore)",
        AlbionServerRegion.Europe => "Albion Europe (Amsterdam)",
        _ => "Unknown Server"
    };
}
