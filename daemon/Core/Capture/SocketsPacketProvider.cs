using AMT.Core.Photon;
using Serilog;
using System.Buffers.Binary;
using System.Collections.Concurrent;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

using System.Runtime.Versioning;

namespace AMT.Core.Capture;

/// <summary>
/// Captures Albion Online network traffic using raw sockets.
/// Filters for Photon protocol UDP packets on ports 5055, 5056, 5058.
/// Requires administrator privileges.
/// </summary>
[SupportedOSPlatform("windows")]
public class SocketsPacketProvider : IPacketProvider
{
    private static readonly HashSet<ushort> PhotonPorts = [5055, 5056, 5058];

    private readonly IPhotonReceiver _photonReceiver;
    private readonly Lock _lifecycleLock = new();
    private readonly List<Socket> _sockets = [];
    private readonly List<Task> _receiveTasks = [];
    private readonly ConcurrentBag<byte[]> _buffers = [];
    private volatile bool _stopReceiving;
    private bool _isStarted;

    public bool IsRunning
    {
        get { lock (_lifecycleLock) { return _isStarted; } }
    }

    /// <summary>Fired when valid game data is detected from Albion server.</summary>
    public event Action? OnGameDataDetected;

    /// <summary>Fired when a game server IP packet is detected.</summary>
    public event Action<IPAddress>? OnServerPacketDetected;

    /// <summary>Fired when capture encounters an error.</summary>
    public event Action<string>? OnCaptureError;

    public SocketsPacketProvider(IPhotonReceiver photonReceiver)
    {
        _photonReceiver = photonReceiver ?? throw new ArgumentNullException(nameof(photonReceiver));
    }

    public bool Start()
    {
        lock (_lifecycleLock)
        {
            if (_isStarted) return true;
            _isStarted = true;
            _stopReceiving = false;
        }

        try
        {
            int activeCount;
            lock (_lifecycleLock)
            {
                activeCount = OpenSockets();
            }

            if (activeCount == 0)
            {
                Stop();
                OnCaptureError?.Invoke("No network interfaces available. Run as Administrator.");
                return false;
            }

            Log.Information("Packet capture started on {Count} interface(s)", activeCount);
            return true;
        }
        catch (Exception ex)
        {
            Stop();
            OnCaptureError?.Invoke($"Failed to start capture: {ex.Message}");
            Log.Error(ex, "Failed to start packet capture");
            return false;
        }
    }

    public void Stop()
    {
        lock (_lifecycleLock)
        {
            if (!_isStarted) return;
            _isStarted = false;
            _stopReceiving = true;

            foreach (var socket in _sockets)
                SafeClose(socket);
            _sockets.Clear();

            try { Task.WaitAll(_receiveTasks.ToArray(), TimeSpan.FromSeconds(2)); }
            catch { /* ignored */ }
            _receiveTasks.Clear();

            while (_buffers.TryTake(out _)) { }
        }

        Log.Information("Packet capture stopped");
    }

    private int OpenSockets()
    {
        var addresses = GetLocalUnicastAddresses(AddressFamily.InterNetwork).ToList();
        if (addresses.Count == 0)
        {
            Log.Warning("No local IPv4 addresses found");
            return 0;
        }

        foreach (var ip in addresses)
        {
            try
            {
                var socket = new Socket(AddressFamily.InterNetwork, SocketType.Raw, ProtocolType.IP);
                socket.Bind(new IPEndPoint(ip, 0));
                socket.SetSocketOption(SocketOptionLevel.IP, SocketOptionName.HeaderIncluded, true);

                var byTrue = new byte[] { 1, 0, 0, 0 };
                var byOut = new byte[4];
                socket.IOControl(IOControlCode.ReceiveAll, byTrue, byOut);

                _sockets.Add(socket);
                Log.Debug("Raw socket bound to {IP}", ip);
            }
            catch (SocketException ex)
            {
                Log.Warning(ex, "Failed to bind raw socket on {IP} - Admin rights required?", ip);
            }
        }

        foreach (var socket in _sockets)
        {
            var buffer = RentBuffer();
            _receiveTasks.Add(Task.Run(() => ReceiveLoopAsync(socket, buffer)));
        }

        return _sockets.Count;
    }

    private async Task ReceiveLoopAsync(Socket socket, byte[] buffer)
    {
        bool gameDetected = false;
        while (!_stopReceiving)
        {
            try
            {
                int bytes = await socket.ReceiveAsync(buffer, SocketFlags.None).ConfigureAwait(false);
                if (bytes > 0)
                {
                    bool isGame = ProcessIPv4(buffer.AsSpan(0, bytes));
                    if (isGame && !gameDetected)
                    {
                        gameDetected = true;
                        OnGameDataDetected?.Invoke();
                    }
                }
            }
            catch (SocketException) when (_stopReceiving)
            {
                break;
            }
            catch (ObjectDisposedException)
            {
                break;
            }
            catch (Exception ex)
            {
                Log.Debug(ex, "Receive loop error");
            }
        }

        ReturnBuffer(buffer);
    }

    private bool ProcessIPv4(ReadOnlySpan<byte> frame)
    {
        if (frame.Length < 20) return false;

        byte verIhl = frame[0];
        if ((verIhl >> 4) != 4) return false;

        int ihl = (verIhl & 0x0F) * 4;
        if (ihl < 20 || frame.Length < ihl) return false;

        // Check for IP fragmentation — skip fragmented packets
        ushort flagsFrag = BinaryPrimitives.ReadUInt16BigEndian(frame.Slice(6, 2));
        if ((flagsFrag & 0x2000) != 0 || (flagsFrag & 0x1FFF) != 0) return false;

        // Only UDP (protocol 17)
        if (frame[9] != 17) return false;
        if (frame.Length < ihl + 8) return false;

        var udp = frame[ihl..];
        ushort srcPort = BinaryPrimitives.ReadUInt16BigEndian(udp);
        ushort dstPort = BinaryPrimitives.ReadUInt16BigEndian(udp[2..]);
        ushort udpLen = BinaryPrimitives.ReadUInt16BigEndian(udp[4..]);

        int payloadOffset = ihl + 8;
        int maxPayload = frame.Length - payloadOffset;
        int payloadLen = Math.Min(maxPayload, Math.Max(0, udpLen - 8));
        if (payloadLen <= 0) return false;

        var payload = frame.Slice(payloadOffset, payloadLen);

        // Check if it's on a known Photon port or looks like Photon data
        bool isPhotonPort = PhotonPorts.Contains(srcPort) || PhotonPorts.Contains(dstPort);
        if (!isPhotonPort && !LooksLikePhoton(payload)) return false;

        try
        {
            var srcIp = new IPAddress(frame.Slice(12, 4).ToArray());
            OnServerPacketDetected?.Invoke(srcIp);
            _photonReceiver.ReceivePacket(payload);
            return true;
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Photon packet processing error");
            return false;
        }
    }

    private static bool LooksLikePhoton(ReadOnlySpan<byte> payload)
    {
        if (payload.Length < 3) return false;
        byte b0 = payload[0];
        return b0 is 0xF1 or 0xF2 or 0xFE;
    }

    private static IEnumerable<IPAddress> GetLocalUnicastAddresses(AddressFamily family)
    {
        try
        {
            return NetworkInterface.GetAllNetworkInterfaces()
                .Where(ni => ni.OperationalStatus == OperationalStatus.Up && ni.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                .SelectMany(ni => ni.GetIPProperties().UnicastAddresses)
                .Select(ua => ua.Address)
                .Where(a => a.AddressFamily == family)
                .Distinct();
        }
        catch { return []; }
    }

    private byte[] RentBuffer() => _buffers.TryTake(out var buf) ? buf : new byte[65535];
    private void ReturnBuffer(byte[] buf) { if (buf.Length == 65535) _buffers.Add(buf); }

    private static void SafeClose(Socket s)
    {
        try { if (s.Connected) s.Shutdown(SocketShutdown.Both); } catch { }
        try { s.Close(); } catch { }
        try { s.Dispose(); } catch { }
    }

    public void Dispose()
    {
        Stop();
        GC.SuppressFinalize(this);
    }
}
