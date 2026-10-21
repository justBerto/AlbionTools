using AMT.Core.GameData;
using AMT.Core.Models;
using Serilog;
using System.Collections;
using System.Text.Json;

namespace AMT.Core.Handlers;

/// <summary>
/// Handles Albion Online marketplace, combat, and loot events from the network stream.
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
    private long _localUserObjectId = 0;

    // Domain events
    public event Action<List<MarketOffer>>? OnMarketOffersReceived;
    public event Action<List<MarketOffer>>? OnMarketBuyOrdersReceived;
    public event Action<LootEntry>? OnLootReceived;
    public event Action<SilverTransaction>? OnSilverReceived;
    public event Action<long>? OnFameReceived;
    public event Action<long>? OnReSpecReceived;
    public event Action<List<string>>? OnPartyUpdated;
    public event Action<string>? OnLocationChanged;
    public event Action<ResolvedCluster>? OnLocationDetailsChanged;
    public event Action<string>? OnPlayerIdentified;
    public event Action<int, Dictionary<byte, object>>? OnRawEvent;
    public event Action<int, Dictionary<byte, object>>? OnRawResponse;

    private readonly List<string> _partyMembers = [];

    public string CurrentLocation => _currentLocation;
    public string PlayerName => _playerName;
    public long LocalUserObjectId => _localUserObjectId;
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
            case EventCodes.HealthUpdate:
                HandleHealthUpdate(parameters);
                break;
            case EventCodes.HealthUpdates:
                HandleHealthUpdates(parameters);
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
            case OperationCodes.AuctionGetOffers:
                Log.Debug("AuctionGetOffers Request intercepted");
                break;
            case OperationCodes.ChangeCluster:
                HandleChangeClusterRequest(parameters);
                break;
        }
    }

    private void HandleAuctionOffers(Dictionary<byte, object> parameters)
    {
        try
        {
            if (parameters.TryGetValue(0, out object? rawJsonObj))
            {
                var jsonStr = rawJsonObj as string ?? rawJsonObj?.ToString();
                if (!string.IsNullOrEmpty(jsonStr))
                {
                    var offers = JsonSerializer.Deserialize<List<MarketOffer>>(jsonStr, JsonOptions);
                    if (offers != null && offers.Count > 0)
                    {
                        Log.Information("Captured {Count} market sell offers at {Location}", offers.Count, _currentLocation);
                        OnMarketOffersReceived?.Invoke(offers);
                    }
                }
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
            if (parameters.TryGetValue(0, out object? rawJsonObj))
            {
                var jsonStr = rawJsonObj as string ?? rawJsonObj?.ToString();
                if (!string.IsNullOrEmpty(jsonStr))
                {
                    var buyOrders = JsonSerializer.Deserialize<List<MarketOffer>>(jsonStr, JsonOptions);
                    if (buyOrders != null && buyOrders.Count > 0)
                    {
                        Log.Information("Captured {Count} market buy orders at {Location}", buyOrders.Count, _currentLocation);
                        OnMarketBuyOrdersReceived?.Invoke(buyOrders);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing AuctionGetRequests response");
        }
    }

    private void HandleGrabbedLoot(Dictionary<byte, object> parameters)
    {
        try
        {
            var loot = new LootEntry
            {
                CapturedAt = DateTime.UtcNow,
                CurrentLocation = _currentLocation
            };

            if (parameters.TryGetValue(0, out object? objId))
                loot.ObjectId = SafeToInt(objId);

            if (parameters.TryGetValue(1, out object? lootedBody))
                loot.LootedFrom = lootedBody?.ToString() ?? "";

            if (parameters.TryGetValue(2, out object? looterName))
                loot.LootedBy = looterName?.ToString() ?? "";

            if (parameters.TryGetValue(3, out object? isSilver))
                loot.IsSilver = isSilver is true or 1;

            if (parameters.TryGetValue(4, out object? itemIndex))
                loot.ItemIndex = SafeToInt(itemIndex);

            if (parameters.TryGetValue(5, out object? quantity))
            {
                if (loot.IsSilver) loot.SilverAmount = SafeToLong(quantity);
                else loot.Quantity = SafeToInt(quantity);
            }

            if (loot.Quantity > 0 || (loot.IsSilver && loot.SilverAmount > 0))
            {
                OnLootReceived?.Invoke(loot);
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing OtherGrabbedLoot event");
        }
    }

    private void HandleTakeSilver(Dictionary<byte, object> parameters)
    {
        try
        {
            // CRITICAL FIX: Only track silver if picked up by local player (or local user was identified)
            if (parameters.TryGetValue(0, out object? objId))
            {
                long entityId = SafeToLong(objId);
                if (_localUserObjectId != 0 && entityId != _localUserObjectId)
                {
                    // Someone else nearby picked up silver; ignore so dashboard doesn't randomly increment!
                    return;
                }
            }

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

    private void HandleHealthUpdate(Dictionary<byte, object> parameters)
    {
        try
        {
            long affectedId = parameters.TryGetValue(0, out var aff) ? SafeToLong(aff) : 0;
            double healthChange = parameters.TryGetValue(2, out var hc) ? SafeToDouble(hc) : 0;
            long causerId = parameters.TryGetValue(6, out var cu) ? SafeToLong(cu) : 0;
            int spellIndex = parameters.TryGetValue(7, out var sp) ? (int)SafeToLong(sp) : 0;

            CombatTracker.Instance.RegisterDamage(affectedId, causerId, healthChange, spellIndex);
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Error parsing HealthUpdate event");
        }
    }

    private void HandleHealthUpdates(Dictionary<byte, object> parameters)
    {
        try
        {
            long affectedId = parameters.TryGetValue(0, out var aff) ? SafeToLong(aff) : 0;
            var healthChanges = ExtractDoubleList(parameters, 2);
            var causerIds = ExtractLongList(parameters, 6);
            var spellIndices = ExtractIntList(parameters, 7);

            int count = Math.Max(healthChanges.Count, causerIds.Count);
            for (int i = 0; i < count; i++)
            {
                double hc = i < healthChanges.Count ? healthChanges[i] : 0;
                long cu = i < causerIds.Count ? causerIds[i] : 0;
                int sp = i < spellIndices.Count ? spellIndices[i] : 0;
                CombatTracker.Instance.RegisterDamage(affectedId, cu, hc, sp);
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Error parsing HealthUpdates event");
        }
    }

    private void HandleJoinResponse(Dictionary<byte, object> parameters)
    {
        try
        {
            if (parameters.TryGetValue(0, out object? userObjId))
            {
                _localUserObjectId = SafeToLong(userObjId);
            }

            if (parameters.TryGetValue(2, out object? username))
            {
                _playerName = username?.ToString() ?? "";
                OnPlayerIdentified?.Invoke(_playerName);
                Log.Information("Player identified: {PlayerName} (ObjectId: {ObjectId})", _playerName, _localUserObjectId);
            }

            CombatTracker.Instance.SetLocalPlayer(_localUserObjectId, _playerName);

            if (parameters.TryGetValue(8, out object? mapIndex))
            {
                var raw = mapIndex?.ToString() ?? "Unknown";
                var resolved = WorldDataManager.Instance.Resolve(raw);
                _currentLocation = resolved.DisplayName;
                OnLocationChanged?.Invoke(_currentLocation);
                OnLocationDetailsChanged?.Invoke(resolved);
                Log.Information("Location resolved to: {Resolved} (raw: {Raw})", resolved, raw);
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
                var resolved = WorldDataManager.Instance.Resolve(raw);
                _currentLocation = resolved.DisplayName;
                OnLocationChanged?.Invoke(_currentLocation);
                OnLocationDetailsChanged?.Invoke(resolved);
                Log.Information("Cluster response changed to: {Resolved} (raw: {Raw})", resolved, raw);
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
            if (parameters.TryGetValue(2, out object? fameObj))
            {
                long fame = SafeToLong(fameObj);
                if (fame > 0)
                {
                    long displayFame = fame / 10000;
                    OnFameReceived?.Invoke(displayFame);
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing UpdateFame event");
        }
    }

    private void HandleUpdateReSpec(Dictionary<byte, object> parameters)
    {
        try
        {
            if (parameters.TryGetValue(2, out object? respecObj))
            {
                long respec = SafeToLong(respecObj);
                if (respec > 0)
                {
                    long displayRespec = respec / 10000;
                    OnReSpecReceived?.Invoke(displayRespec);
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error parsing UpdateReSpecPoints event");
        }
    }

    private void HandlePartyJoined(Dictionary<byte, object> parameters)
    {
        try
        {
            _partyMembers.Clear();
            if (parameters.TryGetValue(2, out object? membersObj) && membersObj is IEnumerable list)
            {
                foreach (var item in list)
                {
                    if (item != null && !string.IsNullOrWhiteSpace(item.ToString()))
                    {
                        _partyMembers.Add(item.ToString()!);
                    }
                }
            }
            CombatTracker.Instance.SetPartyMembers(_partyMembers);
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
                    CombatTracker.Instance.SetPartyMembers(_partyMembers);
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
                    CombatTracker.Instance.SetPartyMembers(_partyMembers);
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
        CombatTracker.Instance.SetPartyMembers(_partyMembers);
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

    public static double SafeToDouble(object? value) => value switch
    {
        double d => d,
        float f => f,
        int i => i,
        long l => l,
        short s => s,
        byte b => b,
        string str when double.TryParse(str, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double parsed) => parsed,
        _ => 0.0
    };

    public static List<double> ExtractDoubleList(Dictionary<byte, object> parameters, byte key)
    {
        var result = new List<double>();
        if (!parameters.TryGetValue(key, out var val) || val == null) return result;
        if (val is Array arr)
        {
            foreach (var item in arr) result.Add(SafeToDouble(item));
        }
        else if (val is IEnumerable enumerable && !(val is string))
        {
            foreach (var item in enumerable) result.Add(SafeToDouble(item));
        }
        else
        {
            result.Add(SafeToDouble(val));
        }
        return result;
    }

    public static List<long> ExtractLongList(Dictionary<byte, object> parameters, byte key)
    {
        var result = new List<long>();
        if (!parameters.TryGetValue(key, out var val) || val == null) return result;
        if (val is Array arr)
        {
            foreach (var item in arr) result.Add(SafeToLong(item));
        }
        else if (val is IEnumerable enumerable && !(val is string))
        {
            foreach (var item in enumerable) result.Add(SafeToLong(item));
        }
        else
        {
            result.Add(SafeToLong(val));
        }
        return result;
    }

    public static List<int> ExtractIntList(Dictionary<byte, object> parameters, byte key)
    {
        var result = new List<int>();
        if (!parameters.TryGetValue(key, out var val) || val == null) return result;
        if (val is Array arr)
        {
            foreach (var item in arr) result.Add(SafeToInt(item));
        }
        else if (val is IEnumerable enumerable && !(val is string))
        {
            foreach (var item in enumerable) result.Add(SafeToInt(item));
        }
        else
        {
            result.Add(SafeToInt(val));
        }
        return result;
    }
}
