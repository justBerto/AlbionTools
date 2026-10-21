using AMT.Core.GameData;
using AMT.Core.Models;
using Serilog;
using System.Collections;
using System.Text.Json;

namespace AMT.Core.Handlers;

/// <summary>
/// Handles Albion Online marketplace and loot events from the network stream.
/// Subscribes to AlbionParser events and emits domain-level events.
/// </summary>
public class GameEventHandler
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly AlbionParser _parser;
    private string _currentLocation = "Thetford";
    private string _playerName = "Adventurer";

    // Domain events
    public event Action<List<MarketOffer>>? OnMarketOffersReceived;
    public event Action<List<MarketOffer>>? OnMarketBuyOrdersReceived;
    public event Action<LootEntry>? OnLootReceived;
    public event Action<SilverTransaction>? OnSilverReceived;
    public event Action<long>? OnFameReceived;
    public event Action<long>? OnReSpecReceived;
    public event Action<List<string>>? OnPartyUpdated;
    public event Action<string>? OnLocationChanged;
    public event Action<string>? OnPlayerIdentified;
    public event Action<int, Dictionary<byte, object>>? OnRawEvent;
    public event Action<int, Dictionary<byte, object>>? OnRawResponse;

    private readonly List<string> _partyMembers = [];

    public string CurrentLocation => _currentLocation;
    public string PlayerName => _playerName;
    public IReadOnlyList<string> PartyMembers => _partyMembers;

    public GameEventHandler(AlbionParser parser)
    {
        _parser = parser;
        _parser.OnGameEvent += HandleGameEvent;
        _parser.OnGameResponse += HandleGameResponse;
        _parser.OnGameRequest += HandleGameRequest;
    }

    private void HandleGameEvent(int eventCode, Dictionary<byte, object> parameters)
    {
        OnRawEvent?.Invoke(eventCode, parameters);

        switch ((EventCodes)eventCode)
        {
            case EventCodes.OtherGrabbedLoot:
                HandleGrabbedLoot(parameters);
                break;
            case EventCodes.TakeSilver:
                HandleTakeSilver(parameters);
                break;
            case EventCodes.UpdateFame:
                HandleUpdateFame(parameters);
                break;
            case EventCodes.UpdateReSpecPoints:
                HandleUpdateReSpec(parameters);
                break;
            case EventCodes.PartyJoined:
                HandlePartyJoined(parameters);
                break;
            case EventCodes.PartyPlayerJoined:
                HandlePartyPlayerJoined(parameters);
                break;
            case EventCodes.PartyPlayerLeft:
                HandlePartyPlayerLeft(parameters);
                break;
            case EventCodes.PartyDisbanded:
                HandlePartyDisbanded();
                break;
        }
    }

    private void HandleGameResponse(int operationCode, Dictionary<byte, object> parameters)
    {
        OnRawResponse?.Invoke(operationCode, parameters);
        Log.Debug("GameResponse OpCode: {OpCode} ({Name}), ParamCount: {Count}",
            operationCode, Enum.GetName(typeof(OperationCodes), operationCode) ?? "Unknown", parameters.Count);

        switch ((OperationCodes)operationCode)
        {
            case OperationCodes.AuctionGetOffers:
                HandleAuctionOffers(parameters);
                break;
            case OperationCodes.AuctionGetRequests:
                HandleAuctionBuyOrders(parameters);
                break;
            case OperationCodes.Join:
                HandleJoinResponse(parameters);
                break;
            case OperationCodes.ChangeCluster:
                HandleChangeClusterResponse(parameters);
                break;
        }
    }

    private void HandleGameRequest(int operationCode, Dictionary<byte, object> parameters)
    {
        switch ((OperationCodes)operationCode)
        {
            case OperationCodes.ChangeCluster:
                HandleChangeClusterRequest(parameters);
                break;
        }
    }

    private void HandleAuctionOffers(Dictionary<byte, object> parameters)
    {
        try
        {
            Log.Information("Processing AuctionGetOffers response with {ParamCount} parameters.", parameters.Count);

            // Find parameter containing json array (usually param 0)
            object? auctionData = null;
            if (parameters.TryGetValue(0, out var p0)) auctionData = p0;
            else if (parameters.TryGetValue(1, out var p1)) auctionData = p1;

            if (auctionData == null)
            {
                Log.Warning("AuctionGetOffers had no data in param 0 or 1. Keys present: {Keys}",
                    string.Join(", ", parameters.Keys));
                return;
            }

            var jsonList = ExtractJsonStrings(auctionData);
            Log.Information("Found {Count} raw offer JSON strings in AuctionGetOffers response.", jsonList.Count);

            var offers = new List<MarketOffer>();
            foreach (var json in jsonList)
            {
                if (string.IsNullOrWhiteSpace(json)) continue;
                try
                {
                    var offer = JsonSerializer.Deserialize<MarketOffer>(json, JsonOptions);
                    if (offer != null)
                    {
                        offer.Location = LocationResolver.CanonicalCity(_currentLocation);
                        offer.OfferType = "sell_order";
                        offer.CapturedAt = DateTime.UtcNow;
                        offers.Add(offer);
                    }
                }
                catch (Exception ex)
                {
                    Log.Debug(ex, "Failed to deserialize market offer JSON: {Snippet}", json.Length > 100 ? json[..100] : json);
                }
            }

            if (offers.Count > 0)
            {
                Log.Information("Successfully parsed {Count} marketplace sell offers at {Location}!", offers.Count, _currentLocation);
                OnMarketOffersReceived?.Invoke(offers);
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing AuctionGetOffers response");
        }
    }

    private void HandleAuctionBuyOrders(Dictionary<byte, object> parameters)
    {
        try
        {
            Log.Information("Processing AuctionGetRequests response with {ParamCount} parameters.", parameters.Count);

            object? auctionData = null;
            if (parameters.TryGetValue(0, out var p0)) auctionData = p0;
            else if (parameters.TryGetValue(1, out var p1)) auctionData = p1;

            if (auctionData == null) return;

            var jsonList = ExtractJsonStrings(auctionData);
            var buyOrders = new List<MarketOffer>();
            foreach (var json in jsonList)
            {
                if (string.IsNullOrWhiteSpace(json)) continue;
                try
                {
                    var order = JsonSerializer.Deserialize<MarketOffer>(json, JsonOptions);
                    if (order != null)
                    {
                        order.Location = LocationResolver.CanonicalCity(_currentLocation);
                        order.OfferType = "buy_order";
                        order.CapturedAt = DateTime.UtcNow;
                        buyOrders.Add(order);
                    }
                }
                catch (Exception ex)
                {
                    Log.Debug(ex, "Failed to deserialize market buy order JSON: {Snippet}", json.Length > 100 ? json[..100] : json);
                }
            }

            if (buyOrders.Count > 0)
            {
                Log.Information("Successfully parsed {Count} marketplace buy orders at {Location}!", buyOrders.Count, _currentLocation);
                OnMarketBuyOrdersReceived?.Invoke(buyOrders);
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing AuctionGetRequests response");
        }
    }

    private static List<string> ExtractJsonStrings(object rawData)
    {
        var result = new List<string>();
        if (rawData is string singleStr)
        {
            result.Add(singleStr);
        }
        else if (rawData is IEnumerable enumerable)
        {
            foreach (var item in enumerable)
            {
                if (item is string s && !string.IsNullOrWhiteSpace(s))
                {
                    result.Add(s);
                }
                else if (item != null)
                {
                    var str = item.ToString();
                    if (!string.IsNullOrWhiteSpace(str) && str.TrimStart().StartsWith('{'))
                    {
                        result.Add(str);
                    }
                }
            }
        }
        return result;
    }

    private void HandleGrabbedLoot(Dictionary<byte, object> parameters)
    {
        try
        {
            var loot = new LootEntry { CapturedAt = DateTime.UtcNow };

            if (parameters.TryGetValue(1, out object? lootedFrom))
                loot.LootedFrom = lootedFrom?.ToString() ?? "";
            if (parameters.TryGetValue(2, out object? looter))
                loot.LootedBy = looter?.ToString() ?? "";
            if (parameters.TryGetValue(3, out object? isSilver))
                loot.IsSilver = isSilver is true or 1;
            if (parameters.TryGetValue(4, out object? itemIndex))
                loot.ItemIndex = SafeToInt(itemIndex);
            if (parameters.TryGetValue(5, out object? quantity))
            {
                loot.Quantity = SafeToInt(quantity);
                if (loot.IsSilver) loot.SilverAmount = SafeToLong(quantity);
            }

            OnLootReceived?.Invoke(loot);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing GrabbedLoot event");
        }
    }

    private void HandleTakeSilver(Dictionary<byte, object> parameters)
    {
        try
        {
            var tx = new SilverTransaction { CapturedAt = DateTime.UtcNow };

            if (parameters.TryGetValue(3, out object? yieldPreTax))
                tx.YieldPreTax = SafeToLong(yieldPreTax);
            if (parameters.TryGetValue(4, out object? clusterTax))
                tx.ClusterTax = SafeToLong(clusterTax);
            if (parameters.TryGetValue(5, out object? guildTax))
                tx.GuildTax = SafeToLong(guildTax);
            if (parameters.TryGetValue(7, out object? isPremium))
                tx.IsPremium = isPremium is true or 1;
            if (parameters.TryGetValue(8, out object? multiplier))
                tx.Multiplier = SafeToLong(multiplier) / 10000.0;

            long totalTax = tx.ClusterTax + tx.GuildTax;
            tx.YieldAfterTax = Math.Max(0, tx.YieldPreTax - totalTax);

            if (tx.YieldPreTax > 0)
            {
                OnSilverReceived?.Invoke(tx);
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing TakeSilver event");
        }
    }

    private void HandleJoinResponse(Dictionary<byte, object> parameters)
    {
        try
        {
            if (parameters.TryGetValue(2, out object? username))
            {
                _playerName = username?.ToString() ?? "";
                OnPlayerIdentified?.Invoke(_playerName);
                Log.Information("Player identified: {PlayerName}", _playerName);
            }

            if (parameters.TryGetValue(8, out object? mapIndex))
            {
                var raw = mapIndex?.ToString() ?? "Unknown";
                _currentLocation = LocationResolver.CanonicalCity(LocationResolver.Resolve(raw));
                OnLocationChanged?.Invoke(_currentLocation);
                Log.Information("Location resolved to: {Location} (raw: {Raw})", _currentLocation, raw);
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing Join response");
        }
    }

    private void HandleChangeClusterResponse(Dictionary<byte, object> parameters)
    {
        try
        {
            if (parameters.TryGetValue(0, out object? clusterVal))
            {
                var raw = clusterVal?.ToString() ?? "";
                _currentLocation = LocationResolver.CanonicalCity(LocationResolver.Resolve(raw));
                OnLocationChanged?.Invoke(_currentLocation);
                Log.Information("Cluster response changed to: {Location} (raw: {Raw})", _currentLocation, raw);
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing ChangeCluster response");
        }
    }

    private void HandleChangeClusterRequest(Dictionary<byte, object> parameters)
    {
        // Cluster request logging if needed
    }

    private void HandleUpdateFame(Dictionary<byte, object> parameters)
    {
        try
        {
            // Param 2: fameWithZoneMultiplier (scaled by 10,000)
            if (parameters.TryGetValue(2, out object? fameVal))
            {
                long gained = SafeToLong(fameVal) / 10000;
                if (gained > 0)
                {
                    OnFameReceived?.Invoke(gained);
                }
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Error parsing UpdateFame event");
        }
    }

    private void HandleUpdateReSpec(Dictionary<byte, object> parameters)
    {
        try
        {
            if (parameters.TryGetValue(2, out object? reSpecVal))
            {
                long gained = SafeToLong(reSpecVal) / 10000;
                if (gained > 0)
                {
                    OnReSpecReceived?.Invoke(gained);
                }
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Error parsing UpdateReSpecPoints event");
        }
    }

    private void HandlePartyJoined(Dictionary<byte, object> parameters)
    {
        try
        {
            _partyMembers.Clear();
            if (parameters.TryGetValue(5, out object? namesObj) && namesObj is IEnumerable namesList)
            {
                foreach (var item in namesList)
                {
                    if (item != null && !string.IsNullOrWhiteSpace(item.ToString()))
                    {
                        _partyMembers.Add(item.ToString()!);
                    }
                }
            }
            OnPartyUpdated?.Invoke(new List<string>(_partyMembers));
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Error parsing PartyJoined event");
        }
    }

    private void HandlePartyPlayerJoined(Dictionary<byte, object> parameters)
    {
        try
        {
            if (parameters.TryGetValue(2, out object? nameObj))
            {
                var name = nameObj?.ToString();
                if (!string.IsNullOrWhiteSpace(name) && !_partyMembers.Contains(name))
                {
                    _partyMembers.Add(name);
                    OnPartyUpdated?.Invoke(new List<string>(_partyMembers));
                }
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Error parsing PartyPlayerJoined event");
        }
    }

    private void HandlePartyPlayerLeft(Dictionary<byte, object> parameters)
    {
        try
        {
            if (parameters.TryGetValue(2, out object? nameObj) || parameters.TryGetValue(1, out nameObj))
            {
                var name = nameObj?.ToString();
                if (!string.IsNullOrWhiteSpace(name))
                {
                    _partyMembers.Remove(name);
                    OnPartyUpdated?.Invoke(new List<string>(_partyMembers));
                }
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Error parsing PartyPlayerLeft event");
        }
    }

    private void HandlePartyDisbanded()
    {
        _partyMembers.Clear();
        OnPartyUpdated?.Invoke(new List<string>());
    }

    public static int SafeToInt(object? value) => value switch
    {
        byte b => b,
        short s => s,
        ushort us => us,
        int i => i,
        uint u when u <= int.MaxValue => (int)u,
        long l when l is >= int.MinValue and <= int.MaxValue => (int)l,
        string str when int.TryParse(str, out int parsed) => parsed,
        byte[] bytes when bytes.Length >= 4 => BitConverter.ToInt32(bytes, 0),
        byte[] bytes when bytes.Length == 2 => BitConverter.ToInt16(bytes, 0),
        _ => 0
    };

    public static long SafeToLong(object? value) => value switch
    {
        byte b => b,
        short s => s,
        ushort us => us,
        int i => i,
        uint u => u,
        long l => l,
        string str when long.TryParse(str, out long parsed) => parsed,
        byte[] bytes when bytes.Length >= 8 => BitConverter.ToInt64(bytes, 0),
        byte[] bytes when bytes.Length >= 4 => BitConverter.ToInt32(bytes, 0),
        _ => 0
    };
}
