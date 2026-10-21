using System.Buffers;

namespace AMT.Core.Photon;

/// <summary>
/// Interface for receiving raw Photon protocol packets from the network.
/// </summary>
public interface IPhotonReceiver
{
    void ReceivePacket(byte[] payload);
    void ReceivePacket(ReadOnlySpan<byte> payload);
    void ReceivePacket(ReadOnlySequence<byte> payload);
}
