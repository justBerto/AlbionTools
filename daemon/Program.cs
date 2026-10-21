using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using AMT.Core.Capture;
using AMT.Core.GameData;
using AMT.Core.Handlers;
using AMT.Core.Models;
using Serilog;

namespace AlbionTools.Daemon;

[System.Runtime.Versioning.SupportedOSPlatform("windows")]
public class Program
{
    private static readonly List<WebSocket> Clients = [];
    private static readonly object LockObj = new();

    // Live Game State (Zero mock data - strictly driven by packet sniffer)
    private static bool _isSnifferActive = false;
    private static bool _isServerDetected = false;
    private static string _serverRegion = "Asia (Singapore)";
    private static string _characterName = "";
    private static string? _guildName = null;
    private static string? _allianceName = null;
    private static string _currentZone = "";
    private static string _zoneTier = "T0";
    private static string _zoneDanger = "Blue";

    private static DateTime? _sessionStartTime = null;
    private static long _totalFame = 0;
    private static long _totalSilver = 0;
    private static long _reSpecPoints = 0;
    private static List<string> _partyMemberNames = [];

    public static async Task Main(string[] args)
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.Console()
            .CreateLogger();

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine(@"
    ___    __    __    _            ______            __    
   /   |  / /   / /_  (_)___  ____ /_  __/___  ____  / /____
  / /| | / /   / __ \/ / __ \/ __ \ / / / __ \/ __ \/ / ___/
 / ___ |/ /___/ /_/ / / /_/ / / / // / / /_/ / /_/ / (__  ) 
/_/  |_/_____/_.___/_/\____/_/ /_//_/  \____/\____/_/____/  
============================================================
AlbionTools - High Performance Live Network Sniffer Daemon
Engine: Raw Windows Sockets + Photon Protocol Parser
============================================================");
        Console.ResetColor();

        // 1. Initialize packet sniffer pipeline
        var albionParser = new AlbionParser();
        var eventHandler = new GameEventHandler(albionParser);

        void OnGameData()
        {
            _isSnifferActive = true;
            _isServerDetected = true;
            _sessionStartTime ??= DateTime.UtcNow;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[SNIFFER] Live Albion Online game packets detected!");
            Console.ResetColor();
            _ = BroadcastGameStatusAsync();
        }

        void OnServerPacket(IPAddress ip)
        {
            var region = ServerDetectionService.DetectRegion(ip);
            if (region != AlbionServerRegion.Unknown)
            {
                var regionName = ServerDetectionService.GetRegionName(region);
                if (_serverRegion != regionName)
                {
                    _serverRegion = regionName;
                    _isServerDetected = true;
                    _ = BroadcastGameStatusAsync();
                }
            }
        }

        eventHandler.OnPlayerIdentified += (name) =>
        {
            _characterName = name;
            _sessionStartTime ??= DateTime.UtcNow;
            Console.WriteLine($"[PLAYER] Logged in as: {name}");
            _ = BroadcastGameStatusAsync();
        };

        eventHandler.OnLocationDetailsChanged += (cluster) =>
        {
            _currentZone = cluster.DisplayName;
            _zoneTier = cluster.Tier;
            _zoneDanger = cluster.Danger;
            Console.WriteLine($"[ZONE] Entered: {cluster.DisplayName} ({cluster.Tier}, {cluster.Danger})");
            _ = BroadcastGameStatusAsync();
            _ = BroadcastJsonAsync(new
            {
                @event = "ZONE_ENTERED",
                data = new
                {
                    clusterIndex = cluster.ClusterIndex,
                    clusterName = cluster.DisplayName,
                    tier = cluster.Tier,
                    danger = cluster.Danger,
                    enteredAt = DateTime.UtcNow.ToString("o")
                }
            });
        };

        CombatTracker.Instance.OnCombatUpdated += () =>
        {
            _ = BroadcastPartyUpdateAsync();
        };

        eventHandler.OnSilverReceived += (tx) =>
        {
            _totalSilver += tx.DisplayYieldAfterTax;
            _ = BroadcastSessionStatsAsync();
        };

        eventHandler.OnFameReceived += (fame) =>
        {
            _totalFame += fame;
            _ = BroadcastSessionStatsAsync();
        };

        eventHandler.OnReSpecReceived += (respec) =>
        {
            _reSpecPoints += respec;
            _ = BroadcastSessionStatsAsync();
        };

        eventHandler.OnPartyUpdated += (names) =>
        {
            _partyMemberNames = names;
            _ = BroadcastPartyUpdateAsync();
        };

        eventHandler.OnLootReceived += (loot) =>
        {
            string itemId = loot.IsSilver ? "SILVER" : $"ITEM_{loot.ItemIndex}";
            string name = loot.IsSilver ? "Silver" : ItemDatabase.Instance.GetDisplayName(itemId);
            int tier = loot.IsSilver ? 0 : ItemDatabase.ExtractTier(itemId);
            int enchant = loot.IsSilver ? 0 : ItemDatabase.ExtractEnchantment(itemId);
            int qty = loot.IsSilver ? (int)loot.DisplaySilver : Math.Max(1, loot.Quantity);
            long estVal = loot.IsSilver ? loot.DisplaySilver : 0;

            _ = BroadcastJsonAsync(new
            {
                @event = "NEW_LOOT",
                data = new
                {
                    id = Guid.NewGuid().ToString("N")[..8],
                    itemId,
                    name,
                    tier,
                    enchantment = enchant,
                    quality = 1,
                    amount = qty,
                    estimatedValue = estVal,
                    source = !string.IsNullOrEmpty(loot.LootedFrom) ? loot.LootedFrom : "Mob",
                    timestamp = DateTime.Now.ToString("HH:mm:ss"),
                    looterName = !string.IsNullOrEmpty(loot.LootedBy) ? loot.LootedBy : _characterName
                }
            });
        };

        // 2. Start Capture: Try Npcap first (No admin required), fallback to Raw Sockets
        IPacketProvider packetProvider;
        if (NpcapPacketProvider.IsNpcapInstalled())
        {
            var npcap = new NpcapPacketProvider(albionParser);
            npcap.OnGameDataDetected += OnGameData;
            npcap.OnServerPacketDetected += OnServerPacket;
            npcap.OnCaptureError += (err) => Console.WriteLine($"[NPCAP WARNING] {err}");

            if (npcap.Start())
            {
                packetProvider = npcap;
                _isSnifferActive = true;
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[SNIFFER] Capture Engine: Npcap (Standard User mode, no Administrator required!)");
                Console.ResetColor();
            }
            else
            {
                npcap.Dispose();
                packetProvider = SetupRawSockets(albionParser, OnGameData, OnServerPacket);
            }
        }
        else
        {
            packetProvider = SetupRawSockets(albionParser, OnGameData, OnServerPacket);
        }

        // 4. Start Local WebSocket IPC Server on Port 4040
        var listener = new HttpListener();
        listener.Prefixes.Add("http://127.0.0.1:4040/");
        try
        {
            listener.Start();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[SERVER] WebSocket Daemon listening on ws://127.0.0.1:4040/ws");
            Console.ResetColor();
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"[SERVER ERROR] Failed to start HTTP listener on port 4040: {ex.Message}");
            Console.ResetColor();
        }

        _ = Task.Run(HandleListenerLoop);
        _ = Task.Run(PeriodicStatsLoop);

        Console.WriteLine("[READY] AlbionTools Daemon is active and ready. Press Ctrl+C to terminate.\n");
        await Task.Delay(-1);

        async Task HandleListenerLoop()
        {
            while (listener.IsListening)
            {
                try
                {
                    var context = await listener.GetContextAsync();
                    if (context.Request.IsWebSocketRequest)
                    {
                        _ = ProcessWebSocketConnection(context);
                    }
                    else
                    {
                        context.Response.StatusCode = 200;
                        byte[] buffer = Encoding.UTF8.GetBytes("AlbionTools Daemon WebSocket Server Active.");
                        context.Response.ContentType = "text/plain";
                        await context.Response.OutputStream.WriteAsync(buffer);
                        context.Response.Close();
                    }
                }
                catch
                {
                    // Listener interrupted
                }
            }
        }
    }

    private static async Task ProcessWebSocketConnection(HttpListenerContext context)
    {
        var wsContext = await context.AcceptWebSocketAsync(null);
        var socket = wsContext.WebSocket;

        lock (LockObj)
        {
            Clients.Add(socket);
        }

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine($"[CLIENT] Frontend connected! Total active clients: {Clients.Count}");
        Console.ResetColor();

        // Send current real game status, stats, and party
        await SendJsonAsync(socket, BuildGameStatusPayload());
        await SendJsonAsync(socket, BuildSessionStatsPayload());
        await SendJsonAsync(socket, BuildPartyPayload());

        var buffer = new byte[4096];
        try
        {
            while (socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                }
                else if (result.MessageType == WebSocketMessageType.Text)
                {
                    var msg = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    HandleClientCommand(msg);
                }
            }
        }
        catch
        {
            // Client disconnected
        }
        finally
        {
            lock (LockObj)
            {
                Clients.Remove(socket);
            }
            Console.WriteLine($"[CLIENT] Frontend disconnected. Active clients: {Clients.Count}");
        }
    }

    private static async Task PeriodicStatsLoop()
    {
        while (true)
        {
            await Task.Delay(1000);
            if (_sessionStartTime != null)
            {
                await BroadcastSessionStatsAsync();
            }
        }
    }

    private static object BuildGameStatusPayload()
    {
        bool hasChar = !string.IsNullOrEmpty(_characterName);
        bool hasZone = !string.IsNullOrEmpty(_currentZone);

        return new
        {
            @event = "GAME_STATUS",
            data = new
            {
                isGameDataLoaded = true,
                isSnifferActive = _isSnifferActive,
                isServerDetected = _isServerDetected,
                serverRegion = _serverRegion,
                isCharacterDetected = hasChar,
                characterName = hasChar ? _characterName : "Waiting for Albion Online...",
                guildName = _guildName,
                allianceName = _allianceName,
                isLocationDetected = hasZone,
                currentZone = hasZone ? _currentZone : "Not in World",
                zoneTier = _zoneTier,
                zoneDanger = _zoneDanger
            }
        };
    }

    private static object BuildSessionStatsPayload()
    {
        int uptime = _sessionStartTime.HasValue
            ? Math.Max(0, (int)(DateTime.UtcNow - _sessionStartTime.Value).TotalSeconds)
            : 0;

        long famePerHour = uptime > 0 ? (long)(_totalFame * 3600.0 / uptime) : 0;
        long silverPerHour = uptime > 0 ? (long)(_totalSilver * 3600.0 / uptime) : 0;
        long reSpecPerHour = uptime > 0 ? (long)(_reSpecPoints * 3600.0 / uptime) : 0;

        return new
        {
            @event = "SESSION_STATS",
            data = new
            {
                uptimeSeconds = uptime,
                totalFame = _totalFame,
                famePerHour,
                totalSilver = _totalSilver,
                silverPerHour,
                reSpecPoints = _reSpecPoints,
                reSpecPerHour,
                might = 0,
                mightPerHour = 0,
                favor = 0,
                favorPerHour = 0
            }
        };
    }

    private static object BuildPartyPayload()
    {
        var members = CombatTracker.Instance.BuildPartyMembersPayload();
        return new
        {
            @event = "PARTY_UPDATE",
            data = members
        };
    }

    private static async Task BroadcastGameStatusAsync() => await BroadcastJsonAsync(BuildGameStatusPayload());
    private static async Task BroadcastSessionStatsAsync() => await BroadcastJsonAsync(BuildSessionStatsPayload());
    private static async Task BroadcastPartyUpdateAsync() => await BroadcastJsonAsync(BuildPartyPayload());

    private static void HandleClientCommand(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("action", out var actionProp))
            {
                string action = actionProp.GetString() ?? "";
                if (action.Equals("RESET_SESSION", StringComparison.OrdinalIgnoreCase))
                {
                    _totalSilver = 0;
                    _totalFame = 0;
                    _reSpecPoints = 0;
                    _sessionStartTime = DateTime.UtcNow;
                    CombatTracker.Instance.Reset();
                    _ = BroadcastSessionStatsAsync();
                    _ = BroadcastGameStatusAsync();
                    _ = BroadcastPartyUpdateAsync();
                    Console.WriteLine("[COMMAND] Session reset executed.");
                }
                else if (action.Equals("RESET_COMBAT", StringComparison.OrdinalIgnoreCase))
                {
                    CombatTracker.Instance.Reset();
                    _ = BroadcastPartyUpdateAsync();
                    Console.WriteLine("[COMMAND] Combat meter reset executed.");
                }
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Error handling client command");
        }
    }

    private static SocketsPacketProvider SetupRawSockets(AlbionParser albionParser, Action onGameData, Action<IPAddress> onServerPacket)
    {
        var rawSockets = new SocketsPacketProvider(albionParser);
        rawSockets.OnGameDataDetected += onGameData;
        rawSockets.OnServerPacketDetected += onServerPacket;
        rawSockets.OnCaptureError += (err) =>
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"[RAW SOCKETS] {err}");
            Console.ResetColor();
        };

        bool started = rawSockets.Start();
        if (started)
        {
            _isSnifferActive = true;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[SNIFFER] Using Windows Raw Sockets (Administrator mode).");
            Console.ResetColor();
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[SNIFFER NOTICE] Npcap not available and Raw Sockets requires Administrator rights. For non-admin tracking, ensure Npcap is installed from https://npcap.com/");
            Console.ResetColor();
        }

        return rawSockets;
    }

    private static async Task BroadcastJsonAsync(object payload)
    {
        string json = JsonSerializer.Serialize(payload);
        byte[] bytes = Encoding.UTF8.GetBytes(json);
        var segment = new ArraySegment<byte>(bytes);

        List<WebSocket> openSockets;
        lock (LockObj)
        {
            openSockets = Clients.Where(s => s.State == WebSocketState.Open).ToList();
        }

        foreach (var socket in openSockets)
        {
            try
            {
                await socket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
            }
            catch
            {
                // Ignore send error on closed connection
            }
        }
    }

    private static async Task SendJsonAsync(WebSocket socket, object payload)
    {
        if (socket.State != WebSocketState.Open) return;
        string json = JsonSerializer.Serialize(payload);
        byte[] bytes = Encoding.UTF8.GetBytes(json);
        await socket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
    }
}
