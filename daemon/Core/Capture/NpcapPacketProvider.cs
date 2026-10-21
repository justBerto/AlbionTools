using AMT.Core.Photon;
using BinaryFormat;
using BinaryFormat.EthernetFrame;
using BinaryFormat.IPv4;
using BinaryFormat.Udp;
using Libpcap;
using Serilog;
using System.Net;
using System.Net.Sockets;

namespace AMT.Core.Capture;

public class NpcapPacketProvider : IPacketProvider
{
    private static readonly HashSet<ushort> PhotonPorts = [5055, 5056, 5058];
    private const string DefaultPacketFilter = "((ip and ((udp and (port 5055 or port 5056 or port 5058)) or (ip[6:2] & 0x3fff != 0))) or (ip6 and (udp and (port 5055 or port 5056 or port 5058))))";

    private readonly IPhotonReceiver _photonReceiver;
    private readonly Lock _dispatcherLock = new();
    private PcapDispatcher? _dispatcher;
    private Thread? _thread;
    private CancellationTokenSource? _cts;
    private bool _isStarted;

    public bool IsRunning => _isStarted && _thread?.IsAlive == true;

    public event Action? OnGameDataDetected;
    public event Action<IPAddress>? OnServerPacketDetected;
    public event Action<string>? OnCaptureError;

    public NpcapPacketProvider(IPhotonReceiver photonReceiver)
    {
        _photonReceiver = photonReceiver ?? throw new ArgumentNullException(nameof(photonReceiver));
    }

    public static bool IsNpcapInstalled()
    {
        try
        {
            var devices = Pcap.ListDevices();
            return devices != null && devices.Count > 0;
        }
        catch
        {
            return false;
        }
    }

    public bool Start()
    {
        lock (_dispatcherLock)
        {
            if (IsRunning) return true;
        }

        try
        {
            var devices = Pcap.ListDevices();
            if (devices == null || devices.Count == 0)
            {
                OnCaptureError?.Invoke("No Npcap network adapters found.");
                return false;
            }

            var dispatcher = new PcapDispatcher(Dispatch);
            int opened = 0;

            for (int i = 0; i < devices.Count; i++)
            {
                var device = devices[i];
                if (device.Flags.HasFlag(PcapDeviceFlags.Loopback)) continue;
                if (!device.Flags.HasFlag(PcapDeviceFlags.Up)) continue;

                try
                {
                    dispatcher.OpenDevice(device, pcap =>
                    {
                        pcap.NonBlocking = true;
                    });
                    opened++;
                    Log.Information("Npcap: Opened adapter {Name} ({Desc})", device.Name, device.Description);
                }
                catch (Exception ex)
                {
                    Log.Debug(ex, "Npcap: Failed opening {Name}", device.Name);
                }
            }

            if (opened == 0)
            {
                dispatcher.Dispose();
                OnCaptureError?.Invoke("Npcap could not open any active network adapters.");
                return false;
            }

            try
            {
                dispatcher.Filter = DefaultPacketFilter;
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Npcap: Failed to set BPF filter, capturing unfiltered");
            }

            lock (_dispatcherLock)
            {
                _dispatcher = dispatcher;
                _isStarted = true;
            }

            _cts = new CancellationTokenSource();
            _thread = new Thread(Worker) { IsBackground = true, Name = "NpcapCaptureThread" };
            _thread.Start();

            Log.Information("Npcap packet capture started on {Count} active adapter(s)", opened);
            return true;
        }
        catch (DllNotFoundException)
        {
            OnCaptureError?.Invoke("Npcap is not installed (wpcap.dll missing).");
            return false;
        }
        catch (Exception ex)
        {
            OnCaptureError?.Invoke($"Npcap start error: {ex.Message}");
            Log.Error(ex, "Failed starting Npcap provider");
            return false;
        }
    }

    private void Worker()
    {
        var token = _cts?.Token ?? CancellationToken.None;
        while (!token.IsCancellationRequested)
        {
            try
            {
                PcapDispatcher? disp;
                lock (_dispatcherLock)
                {
                    disp = _dispatcher;
                }

                if (disp == null) break;

                int dispatched = disp.Dispatch(100);
                if (dispatched == 0)
                {
                    Thread.Sleep(10);
                }
            }
            catch (Exception ex)
            {
                Log.Debug(ex, "Npcap dispatch iteration error");
                Thread.Sleep(100);
            }
        }
    }

    private void Dispatch(Pcap pcap, ref Packet packet)
    {
        if (packet.CapturedLength < packet.DeclaredLength || packet.CapturedLength < 14)
            return;

        var ethReader = new BinaryFormatReader(packet.Data);
        var eth = new L2EthernetFrameShape();
        if (!ethReader.TryReadL2EthernetFrame(ref eth))
            return;

        ushort etherType = (ushort)((packet.Data[12] << 8) | packet.Data[13]);
        ReadOnlySpan<byte> l3 = eth.Payload;

        if (etherType == 0x0800) // IPv4
        {
            if (l3.Length < 20) return;
            var ipReader = new BinaryFormatReader(l3);
            var ip4 = new IPv4PacketShape();
            if (!ipReader.TryReadIPv4Packet(ref ip4))
                return;

            if ((ProtocolType)ip4.Protocol == ProtocolType.Udp)
            {
                var srcIp = new IPAddress(l3.Slice(12, 4).ToArray());
                HandleUdp(ip4.Payload, srcIp);
            }
        }
    }

    private void HandleUdp(ReadOnlySpan<byte> udpBytes, IPAddress srcIp)
    {
        if (udpBytes.Length < 8) return;

        var udpReader = new BinaryFormatReader(udpBytes);
        var udp = new UdpPacketShape();
        if (!udpReader.TryReadUdpPacket(ref udp))
            return;

        bool isPhotonPort = PhotonPorts.Contains(udp.SourcePort) || PhotonPorts.Contains(udp.DestinationPort);
        if (!isPhotonPort && !LooksLikePhoton(udp.Payload))
            return;

        try
        {
            OnServerPacketDetected?.Invoke(srcIp);
            OnGameDataDetected?.Invoke();
            _photonReceiver.ReceivePacket(udp.Payload);
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Photon packet error in Npcap provider");
        }
    }

    private static bool LooksLikePhoton(ReadOnlySpan<byte> payload)
    {
        if (payload.Length < 3) return false;
        byte b0 = payload[0];
        return b0 is 0xF1 or 0xF2 or 0xFE;
    }

    public void Stop()
    {
        _cts?.Cancel();
        lock (_dispatcherLock)
        {
            _dispatcher?.Dispose();
            _dispatcher = null;
            _isStarted = false;
        }

        try { _thread?.Join(TimeSpan.FromSeconds(1)); } catch { }
        _thread = null;
        _cts?.Dispose();
        _cts = null;
    }

    public void Dispose()
    {
        Stop();
        GC.SuppressFinalize(this);
    }
}
