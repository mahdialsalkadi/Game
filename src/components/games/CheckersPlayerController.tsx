"use client";

import React, { useMemo, useState } from "react";
import { Crown, Shield, Swords } from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import {
  getAllLegalMoves,
  CHECKERS_SIZE,
  type CheckersMoveOption
} from "@/game/checkersEngine";
import { getPlayerInitials } from "@/utils/playerDisplay";

interface CheckersPlayerControllerProps {
  gameState: FullRoomState;
  playerId: string;
  isMyTurn: boolean;
  sendAction: (payload: Record<string, unknown>) => void;
  errorToast?: string | null;
  triggerHaptic?: (pattern: number | number[]) => void;
}

export default function CheckersPlayerController({
  gameState,
  playerId,
  isMyTurn,
  sendAction,
  errorToast,
  triggerHaptic
}: CheckersPlayerControllerProps) {
  const me = gameState.players[playerId];
  const state = gameState.checkersState;
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const myColor = me?.color || "#F59E0B";

  const board = state?.board || [];
  const pending = state?.pendingCapture;
  const pendingForMe = pending?.playerId === playerId ? pending : null;

  // اللاعب صاحب الصفوف العليا يرى رقعته مقلوبة لتبقى قطعه في الأسفل دائماً.
  const flip = state?.topPlayerId === playerId;
  const displayRow = (row: number) => (flip ? CHECKERS_SIZE - 1 - row : row);

  const legalMoves = useMemo<CheckersMoveOption[]>(() => {
    if (!state || !isMyTurn) return [];
    if (pendingForMe) {
      return getAllLegalMoves(
        state.board,
        playerId,
        state.topPlayerId,
        { row: pendingForMe.row, col: pendingForMe.col }
      );
    }
    return getAllLegalMoves(state.board, playerId, state.topPlayerId);
  }, [state, isMyTurn, playerId, pendingForMe]);

  const legalDestinations = useMemo(() => {
    if (!selected) return new Set<string>();
    // نشتق الوجهات من قائمة الحركات القانونية نفسها (التي تراعي
    // الأكل الإجباري وسلسلة الأكل) بدلاً من حركات القطعة الخام.
    return new Set(
      legalMoves
        .filter(
          (move) =>
            move.from.row === selected.row && move.from.col === selected.col
        )
        .map((move) => `${move.to.row}:${move.to.col}`)
    );
  }, [selected, legalMoves]);

  const ownMoves = useMemo(() => {
    if (!state) return [];
    return legalMoves.map((move) => move.from);
  }, [legalMoves, state]);

  const mustChoose = useMemo(() => {
    const unique = new Map<string, { row: number; col: number }>();
    ownMoves.forEach((from) => unique.set(`${from.row}:${from.col}`, from));
    return [...unique.values()];
  }, [ownMoves]);

  const handleCell = (row: number, col: number) => {
    if (!isMyTurn || !state) return;
    const piece = state.board[row][col];

    if (selected) {
      const isLegal = legalDestinations.has(`${row}:${col}`);
      if (isLegal) {
        triggerHaptic?.([30, 20, 60]);
        sendAction({
          type: "MOVE_CHECKERS_PIECE",
          fromRow: selected.row,
          fromCol: selected.col,
          toRow: row,
          toCol: col
        });
        setSelected(null);
        return;
      }
    }

    if (piece?.playerId === playerId) {
      if (pendingForMe && (pendingForMe.row !== row || pendingForMe.col !== col)) {
        return;
      }
      const canMove = mustChoose.some((from) => from.row === row && from.col === col);
      if (!canMove) return;
      triggerHaptic?.(20);
      setSelected({ row, col });
    } else {
      setSelected(null);
    }
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
            <div className="text-sm font-black text-white truncate max-w-[150px]">{me?.name || "لاعب"}</div>
            <div className="text-[10px] font-bold text-white/50">
              {isMyTurn
                ? pendingForMe
                  ? "أكمل سلسلة الأكل بالقطعة المحددة"
                  : "دورك — اختر قطعة ثم وجهتها"
                : "انتظر دور الخصم"}
            </div>
          </div>
        </div>
        <div className="text-left">
          <div className="text-[10px] font-bold text-white/40">قطعك</div>
          <div className="text-lg font-black" style={{ color: myColor }}>
            {board.reduce(
              (total, row) =>
                total + row.filter((piece) => piece?.playerId === playerId).length,
              0
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/25 bg-slate-950/80 p-2">
        <div className="grid grid-cols-8 gap-[2px] rounded-xl overflow-hidden border-2 border-amber-900/60">
          {Array.from({ length: CHECKERS_SIZE }).map((_, visualRow) =>
            Array.from({ length: CHECKERS_SIZE }).map((__, visualCol) => {
              const row = flip ? CHECKERS_SIZE - 1 - visualRow : visualRow;
              const col = visualCol;
              const dark = (row + col) % 2 === 1;
              const piece = board[row]?.[col];
              const isMine = piece?.playerId === playerId;
              const isSelected = selected?.row === row && selected?.col === col;
              const isLegal = legalDestinations.has(`${row}:${col}`);
              const isPending =
                pendingForMe?.row === row && pendingForMe?.col === col;

              return (
                <button
                  key={`${row}:${col}`}
                  type="button"
                  onClick={() => handleCell(row, col)}
                  disabled={!isMyTurn}
                  className={`relative aspect-square flex items-center justify-center ${
                    dark ? "bg-[#4a2a12]" : "bg-[#e7d3a8]"
                  }`}
                >
                  {isLegal && (
                    <span className="absolute w-[28%] h-[28%] rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  )}
                  {isSelected && (
                    <span className="absolute inset-0 ring-2 ring-amber-300 ring-inset" />
                  )}
                  {piece && (
                    <span
                      className={`relative w-[78%] h-[78%] rounded-full border flex items-center justify-center ${
                        isPending ? "ring-2 ring-rose-400 animate-pulse" : ""
                      }`}
                      style={{
                        backgroundColor: isMine ? myColor : `${gameState.players[piece.playerId]?.color || "#64748b"}55`,
                        borderColor: piece.king ? "#FDE68A" : "rgba(255,255,255,0.65)",
                        backgroundImage: isMine
                          ? `radial-gradient(circle at 32% 26%, #ffffff 0%, ${myColor} 48%, #120a04 100%)`
                          : undefined,
                        opacity: isMine ? 1 : 0.72
                      }}
                    >
                      {piece.king ? (
                        <Crown className="w-1/2 h-1/2 text-amber-200" />
                      ) : (
                        <span className="w-1/3 h-1/3 rounded-full border border-white/30" />
                      )}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white/60 flex items-start gap-1.5">
          <Swords className="w-3.5 h-3.5 text-rose-300 mt-0.5 shrink-0" />
          الأكل إجباري إذا توفرت قفزة قانونية.
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white/60 flex items-start gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
          المربع الأخضر هو وجهة الحركة المتاحة.
        </div>
      </div>
    </div>
  );
}
