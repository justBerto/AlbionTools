namespace AMT.Core.Photon.Protocol18;

internal enum Protocol18Type : byte
{
    Unknown = 0,
    Boolean = 2,
    Byte = 3,
    Short = 4,
    Float = 5,
    Double = 6,
    String = 7,
    Null = 8,
    CompressedInt = 9,
    CompressedLong = 10,
    Int1 = 11,
    Int1Negative = 12,
    Int2 = 13,
    Int2Negative = 14,
    Long1 = 15,
    Long1Negative = 16,
    Long2 = 17,
    Long2Negative = 18,
    Custom = 19,
    Dictionary = 20,
    Hashtable = 21,
    ObjectArray = 23,
    OperationRequest = 24,
    OperationResponse = 25,
    EventData = 26,
    BooleanFalse = 27,
    BooleanTrue = 28,
    ShortZero = 29,
    IntZero = 30,
    LongZero = 31,
    FloatZero = 32,
    DoubleZero = 33,
    ByteZero = 34,
    Array = 64,
    BooleanArray = 66,
    ByteArray = 67,
    ShortArray = 68,
    FloatArray = 69,
    DoubleArray = 70,
    StringArray = 71,
    CompressedIntArray = 73,
    CompressedLongArray = 74,
    CustomTypeArray = 83,
    DictionaryArray = 84,
    HashtableArray = 85,
    CustomTypeSlim = 128,
}

internal ref struct Protocol18Reader
{
    private readonly ReadOnlySpan<byte> _source;

    public Protocol18Reader(ReadOnlySpan<byte> source)
    {
        _source = source;
    }

    public int Position { get; private set; }

    public byte ReadByte()
    {
        if (Position >= _source.Length)
            throw new EndOfStreamException("Failed to read a byte from the Protocol18 payload.");
        return _source[Position++];
    }

    public ReadOnlySpan<byte> ReadSpan(int count)
    {
        if (count < 0 || count > _source.Length - Position)
            throw new EndOfStreamException($"Failed to read {count} bytes from the Protocol18 payload.");
        ReadOnlySpan<byte> result = _source.Slice(Position, count);
        Position += count;
        return result;
    }
}

internal sealed class Protocol18CustomType(byte typeCode, byte[] data)
{
    public byte TypeCode { get; } = typeCode;
    public byte[] Data { get; } = data;

    public override string ToString() => $"Protocol18CustomType({TypeCode}, {Data.Length} bytes)";
}
