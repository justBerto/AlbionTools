import { useEffect, useRef, useState } from "react";
import { GameStatus, SessionStats, PartyMember, LootItem } from "../types";

interface UseAlbionSocketProps {
  onGameStatusUpdate?: (status: GameStatus) => void;
  onSessionStatsUpdate?: (stats: SessionStats) => void;
  onPartyUpdate?: (party: PartyMember[]) => void;
  onLootReceived?: (loot: LootItem) => void;
  onDungeonEvent?: (event: any) => void;
  onZoneEntered?: (zone: { clusterIndex: string; clusterName: string; tier: string; danger: any; enteredAt: string }) => void;
}

export function useAlbionSocket(props: UseAlbionSocketProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);

  // Store latest callbacks in ref to avoid re-triggering connection effects
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    function connect() {
      if (!isMountedRef.current) return;
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      try {
        const wsUrl = "ws://127.0.0.1:4040/ws";
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMountedRef.current) {
            ws.close();
            return;
          }
          console.log("🟢 [AlbionTools] Connected to local Sniffer Daemon on", wsUrl);
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const payload = JSON.parse(event.data);
            setLastMessageTime(new Date().toLocaleTimeString());

            switch (payload.event) {
              case "GAME_STATUS":
                propsRef.current.onGameStatusUpdate?.(payload.data);
                break;
              case "SESSION_STATS":
                propsRef.current.onSessionStatsUpdate?.(payload.data);
                break;
              case "PARTY_UPDATE":
                propsRef.current.onPartyUpdate?.(payload.data);
                break;
              case "NEW_LOOT":
                propsRef.current.onLootReceived?.(payload.data);
                break;
              case "DUNGEON_EVENT":
                propsRef.current.onDungeonEvent?.(payload.data);
                break;
              case "ZONE_ENTERED":
                propsRef.current.onZoneEntered?.(payload.data);
                break;
              default:
                break;
            }
          } catch (err) {
            console.warn("[AlbionTools] Failed to parse daemon packet:", err);
          }
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          ws.close();
        };

        socketRef.current = ws;
      } catch {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []); // Run connection lifecycle only once on mount

  const sendCommand = (action: string, payload?: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action, payload }));
    }
  };

  return {
    isConnected,
    lastMessageTime,
    sendCommand,
  };
}
