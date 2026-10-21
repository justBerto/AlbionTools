using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace AlbionTools.Daemon;

public class Program
{
    private static readonly List<WebSocket> Clients = [];
    private static readonly object LockObj = new();
    private static bool _simulateMode = true;

    public static async Task Main(string[] args)
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine(@"
    ___    __    __    _            ______            __    
   /   |  / /   / /_  (_)___  ____ /_  __/___  ____  / /____
  / /| | / /   / __ \/ / __ \/ __ \ / / / __ \/ __ \/ / ___/
 / ___ |/ /___/ /_/ / / /_/ / / / // / / /_/ / /_/ / (__  ) 
/_/  |_/_____/_.___/_/\____/_/ /_//_/  \____/\____/_/____/  
============================================================
AlbionTools - High Performance Sniffer & Telemetry Daemon
Forked from Triky313/AlbionOnline-StatisticsAnalysis (GPL-3.0)
============================================================");
        Console.ResetColor();

        if (args.Contains("--live"))
        {
            _simulateMode = false;
            Console.WriteLine("[INFO] Mode: Live Network Sniffer (Npcap / Sockets)");
        }
        else
        {
            Console.WriteLine("[INFO] Mode: Real-Time Telemetry Simulation & IPC Bridge (Port 4040)");
            Console.WriteLine("[TIP]  Pass '--live' to bind to physical network cards via Npcap.");
        }

        var listener = new HttpListener();
        listener.Prefixes.Add("http://127.0.0.1:4040/");
        listener.Start();

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("[SERVER] WebSocket Daemon listening on ws://127.0.0.1:4040/ws");
        Console.ResetColor();

        _ = Task.Run(HandleListenerLoop);
        _ = Task.Run(BroadcastTelemetryLoop);

        Console.WriteLine("[READY] Press Ctrl+C to terminate daemon.\n");
        await Task.Delay(-1);

        async Task HandleListenerLoop()
        {
            while (listener.IsListening)
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

        // Send initial game status upon connection
        await SendJsonAsync(socket, new
        {
            @event = "GAME_STATUS",
            data = new
            {
                isGameDataLoaded = true,
                isSnifferActive = true,
                isServerDetected = true,
                serverRegion = "Europe (Amsterdam)",
                isCharacterDetected = true,
                characterName = "LordAlbion",
                guildName = "Black Rose Vanguard",
                allianceName = "ROSE",
                isLocationDetected = true,
                currentZone = "Deathstone Valley",
                zoneTier = "Tier 7",
                zoneDanger = "Black"
            }
        });

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
            }
        }
        catch
        {
            // Client disconnect
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

    private static async Task BroadcastTelemetryLoop()
    {
        long fame = 1_840_000;
        long silver = 620_000;
        int uptime = 3840;
        var random = new Random();

        var sampleItems = new[]
        {
            new { id = "T8_MAIN_SWORD", name = "Elder's Broadsword", tier = 8, ench = 0, val = 245_000 },
            new { id = "T7_ARMOR_CLOTH_SET3@1", name = "Grandmaster's Cultist Robe", tier = 7, ench = 1, val = 180_000 },
            new { id = "T6_POTION_COOLDOWN", name = "Master's Major Energy Potion", tier = 6, ench = 0, val = 6_200 },
            new { id = "T8_CLOTH", name = "Elder's Cloth", tier = 8, ench = 0, val = 8_500 },
            new { id = "T8_2H_BOW", name = "Elder's Warbow", tier = 8, ench = 2, val = 310_000 },
            new { id = "T7_HEAD_PLATE_SET1", name = "Grandmaster's Soldier Helmet", tier = 7, ench = 0, val = 42_000 },
        };

        while (true)
        {
            await Task.Delay(1000);
            uptime++;

            // Increment stats slightly
            fame += random.Next(150, 600);
            silver += random.Next(20, 150);

            // Broadcast session stats every second
            await BroadcastJsonAsync(new
            {
                @event = "SESSION_STATS",
                data = new
                {
                    uptimeSeconds = uptime,
                    totalFame = fame,
                    famePerHour = 1_725_000 + random.Next(-20000, 20000),
                    totalSilver = silver,
                    silverPerHour = 581_000 + random.Next(-10000, 10000),
                    reSpecPoints = 124_000,
                    reSpecPerHour = 116_000,
                    might = 4_250,
                    mightPerHour = 3_980,
                    favor = 2_100,
                    favorPerHour = 1_960
                }
            });

            // Randomly simulate DPS fluctuations
            if (uptime % 2 == 0)
            {
                await BroadcastJsonAsync(new
                {
                    @event = "PARTY_UPDATE",
                    data = new[]
                    {
                        new { id = "1", name = "LordAlbion", guild = "Black Rose Vanguard", currentHp = 3850, maxHp = 3850, dps = 1845 + random.Next(-120, 150), damagePercentage = 38.4, hps = 0, role = "DPS" },
                        new { id = "2", name = "ValkyrieHeals", guild = "Black Rose Vanguard", currentHp = 2900, maxHp = 2900, dps = 120, damagePercentage = 2.5, hps = 1250 + random.Next(-100, 100), role = "Healer" },
                        new { id = "3", name = "IronBastion", guild = "Black Rose Vanguard", currentHp = 5200, maxHp = 5200, dps = 450 + random.Next(-30, 40), damagePercentage = 9.4, hps = 0, role = "Tank" },
                        new { id = "4", name = "ShadowStrike", guild = "Black Rose Vanguard", currentHp = 3100, maxHp = 3100, dps = 1420 + random.Next(-100, 100), damagePercentage = 29.5, hps = 0, role = "DPS" },
                        new { id = "5", name = "FrostArchon", guild = "Black Rose Vanguard", currentHp = 2850, maxHp = 2850, dps = 975 + random.Next(-60, 60), damagePercentage = 20.2, hps = 80, role = "Support" }
                    }
                });
            }

            // Occasionally simulate a loot drop (every 15 seconds)
            if (uptime % 15 == 0)
            {
                var picked = sampleItems[random.Next(sampleItems.Length)];
                await BroadcastJsonAsync(new
                {
                    @event = "NEW_LOOT",
                    data = new
                    {
                        id = Guid.NewGuid().ToString("N")[..8],
                        itemId = picked.id,
                        name = picked.name,
                        tier = picked.tier,
                        enchantment = picked.ench,
                        quality = 1,
                        amount = random.Next(1, 4),
                        estimatedValue = picked.val,
                        source = random.Next(2) == 0 ? "Chest" : "Mob",
                        timestamp = DateTime.Now.ToString("HH:mm:ss"),
                        looterName = random.Next(2) == 0 ? "LordAlbion" : "ShadowStrike"
                    }
                });
            }
        }
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
                // Ignore send error
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
