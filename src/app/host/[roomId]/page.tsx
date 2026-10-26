"use client";

import { use, useState, useEffect } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import SharedBoardScreen from "@/components/SharedBoardScreen";

export default function HostPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const { gameState, lastAnimation, sendAction, isGeneratingAI, errorToast } =
    useGameRoom(roomId, "HOST");

  const [networkOrigin, setNetworkOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const token = sp.get("hostToken") || sp.get("token");
    if (token) {
      sessionStorage.setItem(`host_token_${roomId}`, token);
    }
  }, [roomId]);

  // Auto-start with bots if requested from Lounge
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const autoBots = sp.get("autoBots") === "true";
    const preset = sp.get("preset");
    if (autoBots && gameState && gameState.phase === "LOBBY" && sendAction) {
      const newUrl = window.location.pathname + (preset ? `?preset=${preset}` : "");
      window.history.replaceState({}, "", newUrl);
      sendAction({
        type: "START_DEFAULT_WITH_BOTS",
        presetKey: preset || "MONOPOLY_CLASSIC"
      });
    }
  }, [gameState?.phase, sendAction]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0";

    if (isLocal) {
      fetch("/api/host-info")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.preferredIp && data.preferredIp !== "localhost") {
            const port = window.location.port ? `:${window.location.port}` : "";
            setNetworkOrigin(`${window.location.protocol}//${data.preferredIp}${port}`);
          }
        })
        .catch(() => {});
    }
  }, []);

  if (!gameState) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎲</div>
          <p className="text-slate-400 text-lg">جاري تجهيز لوحة اللعبة #{roomId}...</p>
        </div>
      </div>
    );
  }

  const effectiveOrigin =
    networkOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const joinUrl = effectiveOrigin
    ? `${effectiveOrigin}/room/${roomId}?role=PLAYER`
    : `https://yourgame.com/room/${roomId}?role=PLAYER`;

  return (
    <SharedBoardScreen
      gameState={gameState}
      lastAnimation={lastAnimation}
      joinUrl={joinUrl}
      sendAction={sendAction}
      isGeneratingAI={isGeneratingAI}
      errorToast={errorToast}
    />
  );
}
