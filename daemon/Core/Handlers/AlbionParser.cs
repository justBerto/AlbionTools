using AMT.Core.Photon;
using Serilog;
using System.Globalization;

namespace AMT.Core.Handlers;

/// <summary>
/// Albion-specific Photon parser that extracts operation/event codes
/// and dispatches to registered handlers.
/// </summary>
public sealed class AlbionParser : PhotonParser
{
    /// <summary>Fired when a game event is received (damage, loot, etc.)</summary>
    public event Action<int, Dictionary<byte, object>>? OnGameEvent;

    /// <summary>Fired when an operation request is captured (player actions)</summary>
    public event Action<int, Dictionary<byte, object>>? OnGameRequest;

    /// <summary>Fired when an operation response is received (server replies)</summary>
    public event Action<int, Dictionary<byte, object>>? OnGameResponse;

    protected override void OnEvent(byte code, Dictionary<byte, object> parameters)
    {
        short eventCode = ParseCode(parameters, 252);
        if (eventCode <= -1) return;

        try
        {
            OnGameEvent?.Invoke(eventCode, parameters);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error handling game event {EventCode}", eventCode);
        }
    }

    protected override void OnRequest(byte operationCodeByte, Dictionary<byte, object> parameters)
    {
        short operationCode = ParseCode(parameters, 253);
        if (operationCode <= -1) return;

        try
        {
            OnGameRequest?.Invoke(operationCode, parameters);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error handling game request {OperationCode}", operationCode);
        }
    }

    protected override void OnResponse(byte operationCodeByte, short returnCode, string debugMessage, Dictionary<byte, object> parameters)
    {
        short operationCode = ParseCode(parameters, 253);
        if (operationCode <= -1) return;

        try
        {
            OnGameResponse?.Invoke(operationCode, parameters);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error handling game response {OperationCode}", operationCode);
        }
    }

    private static short ParseCode(Dictionary<byte, object> parameters, byte parameterKey)
    {
        if (!parameters.TryGetValue(parameterKey, out object? value)) return -1;
        try
        {
            return checked((short)Convert.ToInt32(value, CultureInfo.InvariantCulture));
        }
        catch
        {
            return -1;
        }
    }
}
