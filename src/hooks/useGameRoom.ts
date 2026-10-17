import { useEffect, useRef, useState, useCallback } from "react";
import type { FullRoomState } from "../game/gameRoom";

export interface GameRoomHook {
  playerId: string;
  gameState: FullRoomState | null;
  lastAnimation: any;
  isGeneratingAI: boolean;
  errorToast: string | null;
  isConnected: boolean;
  sendAction: (payload: Record<string, unknown>) => void;
  clearError: () => void;
}

export function useGameRoom(
  roomId: string,
  role: "HOST" | "PLAYER",
  partyHost?: string
): GameRoomHook {
  const socketRef = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<FullRoomState | null>(null);
  const [lastAnimation, setLastAnimation] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 1. Retrieve or create a stable playerId safely
  const [playerId, setPlayerId] = useState<string>(() => {
    if (role === "HOST") return "HOST";
    if (typeof window !== "undefined") {
      try {
        const storedId = localStorage.getItem("boardgame_player_id");
        if (storedId) return storedId;
        const newId = `p_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem("boardgame_player_id", newId);
        return newId;
      } catch {
        return `p_${Math.random().toString(36).slice(2, 10)}`;
      }
    }
    return "";
  });

  // Ensure playerId is populated on client mount if it was empty during SSR
  useEffect(() => {
    if (role === "PLAYER" && !playerId && typeof window !== "undefined") {
      try {
        const storedId = localStorage.getItem("boardgame_player_id");
        const resolvedId = storedId || `p_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem("boardgame_player_id", resolvedId);
        setPlayerId(resolvedId);
      } catch {
        setPlayerId(`p_${Math.random().toString(36).slice(2, 10)}`);
      }
    }
  }, [role, playerId]);

  useEffect(() => {
    if (!roomId) return;
    if (role === "PLAYER" && !playerId) return;

    const activePlayerId = role === "HOST" ? "HOST" : playerId;
    const hostToken =
      role === "HOST" && typeof window !== "undefined"
        ? sessionStorage.getItem(`host_token_${roomId}`) || ""
        : "";

    // 2. Build WebSocket URL
    const defaultHost =
      typeof window !== "undefined"
        ? `${window.location.hostname}:1999`
        : "localhost:1999";
    const rawHost =
      partyHost || process.env.NEXT_PUBLIC_PARTY_HOST || defaultHost;
    const host = rawHost.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "");
    const protocol =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "wss"
        : "ws";
    const tokenQuery = hostToken ? `&hostToken=${encodeURIComponent(hostToken)}` : "";
    const wsUrl = `${protocol}://${host}/party/${roomId}?role=${role}&playerId=${activePlayerId}${tokenQuery}`;

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        console.log(`[GameRoom] Connected as ${role} (${activePlayerId}) to room ${roomId}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "AI_GENERATING") {
            setIsGeneratingAI(true);
          } else if (data.type === "STATE_SYNC") {
            setGameState(data.state);
            if (data.state && data.state.phase !== "LOBBY") {
              setIsGeneratingAI(false);
            }
          } else if (data.type === "ACTION_REJECTED") {
            setIsGeneratingAI(false);
            setErrorToast(data.messageAr);
            setTimeout(() => setErrorToast(null), 3000);
          } else {
            // Animation events (DICE_ROLLED, DRAMA_CARD_TRIGGERED, etc.)
            setLastAnimation(data);
          }
        } catch (e) {
          console.error("[GameRoom] Failed to parse message:", e);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsConnected(false);
        console.log("[GameRoom] Disconnected. Attempting reconnect in 2s...");
        reconnectTimeout = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("[GameRoom] WebSocket error:", err);
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [roomId, role, partyHost, playerId]);

  // 3. Unified action sender
  const sendAction = useCallback((payload: Record<string, unknown>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const clearError = useCallback(() => setErrorToast(null), []);

  return {
    playerId,
    gameState,
    lastAnimation,
    isGeneratingAI,
    errorToast,
    isConnected,
    sendAction,
    clearError,
  };
}
