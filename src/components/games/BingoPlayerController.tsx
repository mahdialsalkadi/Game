"use client";

import React from "react";
import { CircleDot, Megaphone, Sparkles } from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import { bingoColumnLetter } from "@/game/bingoEngine";
import { getPlayerInitials } from "@/utils/playerDisplay";

interface BingoPlayerControllerProps {
  gameState: FullRoomState;
  playerId: string;
  isMyTurn: boolean;
  sendAction: (payload: Record<string, unknown>) => void;
  errorToast?: string | null;
  triggerHaptic?: (pattern: number | number[]) => void;
}

export default function BingoPlayerController({
  gameState,
  playerId,
  isMyTurn,
  sendAction,
  errorToast,
  triggerHaptic
}: BingoPlayerControllerProps) {
  const me = gameState.players[playerId];
  const state = gameState.bingoState;
  const card = state?.cards?.[playerId];
  const lastCalled = state?.lastCalled;
  const recentCalls = (state?.calledNumbers || []).slice(-6).reverse();
  const myColor = me?.color || "#F59E0B";

  return (
    <div dir="rtl" className="w-full flex flex-col gap-3 p-4">
      {errorToast && (
        <div className="rounded-xl border border-rose-500/60 bg-rose-950/80 px-3 py-2 text-center text-xs font-bold text-rose-200">
          {errorToast}
        </div>
      )}

      <div
        className="rounded-2xl border-2 p-3 flex items-center justify-between gap-3"
        style={{ borderColor: `${myColor}77`, backgroundColor: `${myColor}15` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-10 h-10 rounded-full border-2 border-white/70 flex items-center justify-center font-black text-slate-950 text-sm shrink-0"
            style={{ backgroundColor: myColor }}
          >
            {getPlayerInitials(me?.name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-white truncate max-w-[150px]" title={me?.name}>
              {me?.name || "لاعب"}
            </div>
            <div className="text-[10px] font-bold text-white/50">
              {isMyTurn ? "دورك — اسحب كرة بينغو" : "انتظر دور لاعب آخر"}
            </div>
          </div>
        </div>
        <div className="text-left shrink-0">
          <div className="text-[10px] font-bold text-white/40">خطوطك</div>
          <div className="text-lg font-black text-amber-300">{card?.lines ?? 0}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/25 bg-slate-950/80 p-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold text-white/40">آخر كرة تم سحبها</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-300">
              {lastCalled ?? "—"}
            </span>
            {typeof lastCalled === "number" && (
              <span className="text-xs font-black text-white/50">
                {bingoColumnLetter(Math.min(4, Math.floor((lastCalled - 1) / 15)))}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 justify-end max-w-[55%]">
          {recentCalls.map((number) => (
            <span
              key={number}
              className="w-7 h-7 rounded-full bg-white/10 border border-white/20 text-[10px] font-black text-white/70 flex items-center justify-center"
            >
              {number}
            </span>
          ))}
          {recentCalls.length === 0 && (
            <span className="text-[10px] font-bold text-white/35">لم تُسحب أي كرة بعد</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-amber-500/30 bg-slate-950/80 p-2">
        <div className="grid grid-cols-5 gap-[3px] mb-[3px]">
          {["B", "I", "N", "G", "O"].map((letter, index) => (
            <div
              key={letter}
              className="rounded-md py-1 text-center text-xs font-black"
              style={{
                backgroundColor:
                  ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"][index] + "33",
                color: ["#fca5a5", "#fcd34d", "#86efac", "#93c5fd", "#d8b4fe"][index]
              }}
            >
              {letter}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-[3px]">
          {(card?.grid || []).map((row, rowIndex) =>
            row.map((value, colIndex) => {
              const marked = Boolean(card?.marked?.[rowIndex]?.[colIndex]);
              const isFree = value === 0;
              return (
                <div
                  key={`${rowIndex}:${colIndex}`}
                  className={`relative aspect-square rounded-lg border flex items-center justify-center text-sm font-black transition-all ${
                    marked
                      ? "border-emerald-400 bg-emerald-500/25 text-emerald-200"
                      : "border-white/10 bg-white/[0.04] text-white/75"
                  }`}
                >
                  {isFree ? (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  ) : (
                    value
                  )}
                  {marked && !isFree && (
                    <span className="absolute inset-1 rounded-md border border-emerald-400/60" />
                  )}
                </div>
              );
            })
          )}
          {!card && (
            <div className="col-span-5 py-8 text-center text-xs font-bold text-white/40">
              بطاقتك قيد التجهيز...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
          <div className="text-[9px] font-bold text-white/40">معلّمة</div>
          <div className="text-base font-black text-emerald-300">{card?.markedCount ?? 0}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
          <div className="text-[9px] font-bold text-white/40">خطوط</div>
          <div className="text-base font-black text-amber-300">{card?.lines ?? 0}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
          <div className="text-[9px] font-bold text-white/40">كرات مسحوبة</div>
          <div className="text-base font-black text-sky-300">
            {state?.calledNumbers?.length ?? 0}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          triggerHaptic?.([25, 30, 70]);
          sendAction({ type: "CALL_BINGO_NUMBER" });
        }}
        disabled={!isMyTurn}
        className="mt-1 w-full rounded-2xl px-4 py-4 font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        style={{
          background: `linear-gradient(135deg, ${myColor}, ${myColor}bb)`,
          color: "#0f172a",
          boxShadow: isMyTurn ? `0 10px 30px ${myColor}44` : undefined
        }}
      >
        {isMyTurn ? (
          <>
            <Megaphone className="w-5 h-5" />
            اسحب كرة بينغو
          </>
        ) : (
          <>
            <CircleDot className="w-5 h-5" />
            دور لاعب آخر يسحب الآن
          </>
        )}
      </button>
    </div>
  );
}
