namespace AMT.Core.Capture;

/// <summary>
/// Abstraction for network packet capture providers (Raw Socket, Npcap, PCAP replay).
/// </summary>
public interface IPacketProvider : IDisposable
{
    bool IsRunning { get; }
    bool Start();
    void Stop();
    event Action? OnGameDataDetected;
    event Action<string>? OnCaptureError;
}
