import { useEffect, useRef, useState, useCallback } from "react";
import { GameStatus, SessionStats, PartyMember, LootItem } from "../types";

interface UseAlbionSocketProps {
  onGameStatusUpdate?: (status: GameStatus) => void;
  onSessionStatsUpdate?: (stats: SessionStats) => void;
  onPartyUpdate?: (party: PartyMember[]) => void;
  onLootReceived?: (loot: LootItem) => void;
  onDungeonEvent?: (event: any) => void;
}

export function useAlbionSocket({
  onGameStatusUpdate,
  onSessionStatsUpdate,
  onPartyUpdate,
  onLootReceived,
  onDungeonEvent,
}: UseAlbionSocketProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    try {
      setIsConnecting(true);
      const wsUrl = "ws://127.0.0.1:4040/ws";
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("🟢 [AlbionTools] Connected to local Sniffer Daemon on", wsUrl);
        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setLastMessageTime(new Date().toLocaleTimeString());

          switch (payload.event) {
            case "GAME_STATUS":
              onGameStatusUpdate?.(payload.data);
              break;
            case "SESSION_STATS":
              onSessionStatsUpdate?.(payload.data);
              break;
            case "PARTY_UPDATE":
              onPartyUpdate?.(payload.data);
              break;
            case "NEW_LOOT":
              onLootReceived?.(payload.data);
              break;
            case "DUNGEON_EVENT":
              onDungeonEvent?.(payload.data);
              break;
            default:
              // Custom event
              break;
          }
        } catch (err) {
          console.warn("[AlbionTools] Failed to parse daemon packet:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        console.log("🔴 [AlbionTools] Disconnected from Sniffer Daemon. Reconnecting in 3s...");
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };

      socketRef.current = ws;
    } catch {
      setIsConnected(false);
      setIsConnecting(false);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [onGameStatusUpdate, onSessionStatsUpdate, onPartyUpdate, onLootReceived, onDungeonEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  const sendCommand = (action: string, payload?: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action, payload }));
    }
  };

  return {
    isConnected,
    isConnecting,
    lastMessageTime,
    sendCommand,
  };
}
