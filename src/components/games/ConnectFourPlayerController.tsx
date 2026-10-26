"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Circle, Sparkles } from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import { getPlayerInitials } from "@/utils/playerDisplay";

interface ConnectFourPlayerControllerProps {
  gameState: FullRoomState;
  playerId: string;
  isMyTurn: boolean;
  sendAction: (payload: Record<string, unknown>) => void;
  errorToast?: string | null;
  triggerHaptic?: (pattern: number | number[]) => void;
}

export default function ConnectFourPlayerController({
  gameState,
  playerId,
  isMyTurn,
  sendAction,
  errorToast,
  triggerHaptic
}: ConnectFourPlayerControllerProps) {
  const me = gameState.players[playerId];
  const state = gameState.connectFourState;
  const board = state?.board || [];
  const myColor = me?.color || "#38BDF8";

  const handleDrop = (column: number) => {
    if (!isMyTurn) return;
    const topRow = board[0]?.[column];
    if (topRow) return;
    triggerHaptic?.([30, 20, 60]);
    sendAction({ type: "DROP_CONNECT_FOUR_PIECE", column });
  };

  return (
    <div dir="rtl" className="w-full flex flex-col gap-3 p-4">
      {errorToast && (
        <div className="rounded-xl border border-rose-500/60 bg-rose-950/80 px-3 py-2 text-center text-xs font-bold text-rose-200">
          {errorToast}
        </div>
      )}

      <div
        className="rounded-2xl border-2 p-3 flex items-center justify-between"
        style={{ borderColor: `${myColor}77`, backgroundColor: `${myColor}15` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-full border-2 border-white/70 flex items-center justify-center font-black text-slate-950 text-sm"
            style={{ backgroundColor: myColor }}
          >
            {getPlayerInitials(me?.name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-white truncate max-w-[150px]" title={me?.name}>
              {me?.name || "لاعب"}
            </div>
            <div className="text-[10px] font-bold text-white/50">
              {isMyTurn ? "دورك الآن — اختر عموداً" : "انتظر دور الخصم"}
            </div>
          </div>
        </div>
        <div className="text-left">
          <div className="text-[10px] font-bold text-white/40">حركاتك</div>
          <div className="text-lg font-black" style={{ color: myColor }}>
            {board.reduce(
              (total, row) =>
                total + row.filter((cell) => cell === playerId).length,
              0
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-500/25 bg-slate-950/70 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-sky-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> أعمدة اللوحة
          </span>
          <span className="text-[10px] font-bold text-white/40">١ ← ٧</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, column) => {
            const full = Boolean(board[0]?.[column]);
            const landingRow = (() => {
              for (let row = 5; row >= 0; row--) {
                if (!board[row]?.[column]) return row;
              }
              return -1;
            })();
            const landingOwner = landingRow >= 0 ? board[landingRow]?.[column] : null;
            return (
              <button
                key={column}
                type="button"
                disabled={!isMyTurn || full}
                onClick={() => handleDrop(column)}
                className={`relative flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-all active:scale-95 ${
                  full
                    ? "border-white/5 bg-white/[0.03] opacity-40"
                    : isMyTurn
                    ? "border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20"
                    : "border-white/10 bg-white/[0.03] opacity-60"
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5 text-sky-300" />
                <span
                  className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center"
                  style={{ backgroundColor: full ? "#1e293b" : `${myColor}66` }}
                >
                  {landingOwner ? (
                    <span
                      className="w-4 h-4 rounded-full border border-white/50"
                      style={{
                        backgroundColor:
                          gameState.players[landingOwner]?.color || "#64748b"
                      }}
                    />
                  ) : (
                    <Circle className="w-3 h-3 text-white/30" />
                  )}
                </span>
                <span className="text-[10px] font-black text-white/60">{column + 1}</span>
              </button>
            );
          })}
        </div>

        {isMyTurn && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[10px] font-bold text-sky-200/80 mt-2"
          >
            اضغط على العمود لإسقاط قرصك. القرص يهبط إلى أدنى خانة فارغة.
          </motion.p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white/60">
          🎯 اصنع خطاً من ٤ أقراص بأي اتجاه.
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white/60">
          🛡️ سدّ خط الخصم قبل أن يكتمل.
        </div>
      </div>
    </div>
  );
}
