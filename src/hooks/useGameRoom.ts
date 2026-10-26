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
  role: "HOST" | "PLAYER" | "SPECTATOR",
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
    if (role !== "PLAYER") return "HOST";
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

    const activePlayerId = role === "PLAYER" ? playerId : "HOST";

    // Resolve the host token synchronously, before the first socket message.
    // The URL token is written by the home page's room-creation flow / invite
    // links; reading it here (instead of in a later effect) prevents the first
    // connection from creating the room with a different token and losing host
    // control on reconnect or under React Strict Mode.
    let hostToken = "";
    if (role === "HOST" && typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        hostToken =
          params.get("hostToken") ||
          params.get("token") ||
          sessionStorage.getItem(`host_token_${roomId}`) ||
          "";
        if (hostToken) {
          sessionStorage.setItem(`host_token_${roomId}`, hostToken);
        }
      } catch {
        hostToken = "";
      }
    }

    // 2. Build WebSocket URL
    const rawHostname =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    const hostname =
      !rawHostname || rawHostname === "0.0.0.0" ? "localhost" : rawHostname;
    const defaultHost = `${hostname}:1999`;
    const rawHost =
      partyHost || process.env.NEXT_PUBLIC_PARTY_HOST || defaultHost;
    const host = rawHost
      .replace(/^https?:\/\//, "")
      .replace(/^wss?:\/\//, "")
      .replace(/\/+$/, "");
    const protocol =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "wss"
        : "ws";
    const tokenQuery = hostToken ? `&hostToken=${encodeURIComponent(hostToken)}` : "";
    const socketRole = role === "SPECTATOR" ? "SPECTATOR" : role;
    const wsUrl = `${protocol}://${host}/party/${roomId}?role=${socketRole}&playerId=${activePlayerId}${tokenQuery}`;

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      try {
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

        ws.onclose = (event) => {
          if (!isMounted) return;
          setIsConnected(false);
          console.warn(`[GameRoom] Disconnected (code ${event.code}). Auto-rehydrating connection in 2s...`);
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) {
            return;
          }
          console.warn(`[GameRoom] WebSocket connection issue to ${wsUrl}. Retrying in 2s...`);
          try {
            ws?.close();
          } catch {}
        };
      } catch (err) {
        if (!isMounted) return;
        console.warn("[GameRoom] Failed to initialize WebSocket:", err);
        reconnectTimeout = setTimeout(connect, 2000);
      }
    }

    connect();

    // Mobile Disconnect Resilience: Instant Rehydration when phone screen wakes up
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED || socketRef.current.readyState === WebSocket.CLOSING) {
          console.log("[GameRoom] Screen awakened: Rehydrating WebSocket session immediately...");
          clearTimeout(reconnectTimeout);
          connect();
        }
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (ws) {
        ws.onerror = null;
        ws.onclose = null;
        try {
          ws.close();
        } catch {}
      }
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
