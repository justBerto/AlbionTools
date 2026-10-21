namespace AMT.Core.Photon.Protocol18.Photon;

public class EventData(byte code, Dictionary<byte, object> parameters)
{
    public byte Code { get; } = code;
    public Dictionary<byte, object> Parameters { get; } = parameters;
}

public class OperationRequest(byte operationCode, Dictionary<byte, object> parameters)
{
    public byte OperationCode { get; } = operationCode;
    public Dictionary<byte, object> Parameters { get; } = parameters;
}

public class OperationResponse(byte operationCode, short returnCode, string debugMessage, Dictionary<byte, object> parameters)
{
    public byte OperationCode { get; } = operationCode;
    public short ReturnCode { get; } = returnCode;
    public string DebugMessage { get; } = debugMessage;
    public Dictionary<byte, object> Parameters { get; } = parameters;
}

public static class CrcCalculator
{
    public static uint Calculate(ReadOnlySpan<byte> bytes, int zeroedOffset, int zeroedLength)
    {
        if (zeroedOffset < 0 || zeroedLength < 0 || zeroedOffset > bytes.Length - zeroedLength)
            throw new ArgumentOutOfRangeException(nameof(zeroedOffset));

        int zeroedEnd = zeroedOffset + zeroedLength;
        uint result = uint.MaxValue;
        const uint key = 3988292384u;

        for (int i = 0; i < bytes.Length; i++)
        {
            byte value = i >= zeroedOffset && i < zeroedEnd ? (byte)0 : bytes[i];
            result ^= value;
            for (int j = 0; j < 8; j++)
            {
                if ((result & 1u) > 0u)
                    result = result >> 1 ^ key;
                else
                    result >>= 1;
            }
        }
        return result;
    }
}

public class NumberDeserializer
{
    public static bool Deserialize(out int value, ReadOnlySpan<byte> source, ref int offset)
    {
        value = 0;
        if (offset < 0 || offset > source.Length - sizeof(int))
            return false;

        ReadOnlySpan<byte> valueBytes = source.Slice(offset, sizeof(int));
        value = (valueBytes[0] << 24) | (valueBytes[1] << 16) | (valueBytes[2] << 8) | valueBytes[3];
        offset += sizeof(int);
        return true;
    }

    public static bool Deserialize(out short value, ReadOnlySpan<byte> source, ref int offset)
    {
        value = 0;
        if (offset < 0 || offset > source.Length - sizeof(short))
            return false;

        ReadOnlySpan<byte> valueBytes = source.Slice(offset, sizeof(short));
        value = (short)((valueBytes[0] << 8) | valueBytes[1]);
        offset += sizeof(short);
        return true;
    }
}
