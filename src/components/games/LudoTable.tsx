"use client";

import React from "react";
import { motion } from "framer-motion";
import { Dices, Home, Menu, QrCode, Trophy } from "lucide-react";
import type { GameTableProps } from "./types";
import LudoBoardView from "../ludo/LudoBoardView";
import RealisticDice3D from "../common/RealisticDice3D";
import GameRulesSheet from "./GameRulesSheet";
import { TableStat, TurnBanner } from "./shared";

const SEAT_STYLES = [
  { glow: "rgba(34,197,94,0.35)", text: "text-emerald-300", ring: "border-emerald-400/60" },
  { glow: "rgba(239,68,68,0.35)", text: "text-rose-300", ring: "border-rose-400/60" },
  { glow: "rgba(234,179,8,0.35)", text: "text-amber-300", ring: "border-amber-400/60" },
  { glow: "rgba(59,130,246,0.35)", text: "text-sky-300", ring: "border-sky-400/60" }
];

export default function LudoTable({
  gameState,
  sendAction,
  lastAnimation,
  displayedDice,
  isRollingDice,
  isSpectator,
  onOpenInvite,
  onOpenMenu
}: GameTableProps) {
  const activePlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  const ludo = gameState.ludoState;
  const seats = Object.values(ludo?.players || {});
  const players = Object.values(gameState.players);

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex flex-col text-white overflow-hidden select-none"
      style={{ background: "radial-gradient(circle at 50% 45%, #12294f 0%, #0a1730 48%, #050a14 100%)" }}
    >
      {/* هالات ألوان المقاعد الأربعة */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-sky-500/10 blur-[110px]" />
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-rose-500/10 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-amber-500/10 blur-[90px]" />

      <header className="relative z-30 flex items-center justify-between gap-2 px-3 md:px-5 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 backdrop-blur-md"
            title="القائمة"
          >
            <Menu className="w-4 h-4" />
          </button>
          <TableStat label="الجولة" value={gameState.currentRound || 1} accent="text-sky-300" />
          <TableStat label="نرد" value={displayedDice ?? "-"} accent="text-white" />
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-sm md:text-base font-black tracking-wide flex items-center justify-center gap-1.5">
            <Dices className="w-4 h-4 text-sky-300" />
            {gameState.themeTitle || "لودو المجلس"}
          </h1>
          <p className="text-[10px] text-white/40 font-bold">صليب ١٥×١٥ · القطع في البيت تُحسم اللعبة</p>
        </div>

        <div className="flex items-center gap-2">
          <GameRulesSheet rulebookId="LUDO" variant="ghost" label="قوانين" />
          <button
            onClick={onOpenInvite}
            className="px-2.5 py-1 rounded-full bg-white/5 border border-sky-400/30 text-sky-300 hover:bg-white/15 text-[11px] font-mono font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {gameState.roomId}
          </button>
        </div>
      </header>

      <div className="relative z-20 flex-1 min-h-0 flex items-center justify-center gap-3 md:gap-6 px-2 md:px-4 py-1">
        {/* مسار اللاعبين على يمين اللوحة */}
        <aside className="hidden xl:flex w-56 flex-col gap-2">
          <div className="text-[10px] font-black text-sky-300/80 tracking-widest px-1">سباق القطع</div>
          {seats.map((seat, index) => {
            const style = SEAT_STYLES[seat.playerIndex % 4];
            const player = gameState.players[seat.playerId];
            return (
              <motion.div
                layout
                key={seat.playerId}
                className={`rounded-2xl border p-2.5 ${style.ring} ${
                  seat.playerId === activePlayerId ? "bg-white/10" : "bg-black/30"
                }`}
                style={{ boxShadow: seat.playerId === activePlayerId ? `0 0 24px ${style.glow}` : undefined }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black truncate max-w-[110px]">{seat.nameAr}</span>
                  <span className={`text-[10px] font-black ${style.text}`}>{seat.finishedCount}/4 في البيت</span>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {seat.tokens.map((token) => (
                    <span
                      key={token.id}
                      className={`h-2 flex-1 rounded-full ${
                        token.state === "FINISHED"
                          ? "bg-amber-300"
                          : token.state === "HOME_PATH"
                          ? "bg-amber-500/70"
                          : token.state === "ON_TRACK"
                          ? "bg-white/70"
                          : "bg-white/15"
                      }`}
                      title={token.state}
                    />
                  ))}
                </div>
                <div className="mt-1 text-[9px] font-bold text-white/40">
                  {player?.isBot ? "بوت · " : ""}
                  {seat.rank ? `المركز ${seat.rank}` : "لم يحسم المركز بعد"}
                </div>
              </motion.div>
            );
          })}
          <div className="mt-auto rounded-2xl border border-white/10 bg-black/30 p-2.5 text-[10px] leading-5 text-white/60">
            <Trophy className="w-3.5 h-3.5 text-amber-300 mb-1" />
            أول لاعب يُدخل قطعه الأربع يفوز. النجمة ⭐ تحمي من الأكل.
          </div>
        </aside>

        {/* اللوحة */}
        <main className="flex-1 min-h-0 flex items-center justify-center">
          <div className="rounded-[26px] p-[3px] bg-gradient-to-br from-[#c9a24a] via-[#5b3f17] to-[#e2c06a] shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
            <div className="rounded-[23px] bg-[#0a1322] p-1.5">
              <LudoBoardView
                gameState={gameState}
                lastAnimation={lastAnimation}
                isRollingDice={isRollingDice}
                displayedDice={displayedDice}
                sendAction={sendAction}
                onTokenClick={(tokenId: number) => sendAction?.({ type: "MOVE_LUDO_TOKEN", tokenId })}
              />
            </div>
          </div>
        </main>

        {/* نرد ولوحة الدور */}
        <aside className="hidden md:flex w-44 flex-col gap-2">
          <div className="rounded-2xl border border-sky-400/25 bg-black/40 p-2 flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-white/50">نرد الدور</span>
            <RealisticDice3D
              values={displayedDice ? [displayedDice] : [1]}
              isRolling={isRollingDice}
              size="md"
              showTray={false}
            />
            {ludo?.pendingDiceRoll ? (
              <span className="text-[10px] font-bold text-emerald-300">حرّك قطعة بـ {ludo.pendingDiceRoll}</span>
            ) : (
              <span className="text-[10px] font-bold text-white/40">بانتظار الرمية</span>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5">
            <div className="text-[10px] font-black text-white/50 mb-1">آخر حركة</div>
            <p className="text-[11px] leading-5 text-white/75 font-bold">
              {ludo?.lastMoveResult?.messageAr ||
                lastAnimation?.messageAr ||
                "الحركة تُنفّذ من جوال اللاعب."}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/25 p-2.5">
            <div className="text-[10px] font-black text-emerald-300 mb-1 flex items-center gap-1">
              <Home className="w-3 h-3" /> من وصل؟
            </div>
            <div className="space-y-1">
              {(ludo?.winners || []).length === 0 && (
                <span className="text-[10px] text-white/40">لا أحد بعد.</span>
              )}
              {(ludo?.winners || []).map((playerId, index) => (
                <div key={playerId} className="text-[10px] font-bold text-white/70">
                  {index + 1}. {gameState.players[playerId]?.name || playerId}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer className="relative z-20 flex items-center justify-between gap-2 px-3 md:px-5 pb-2">
        <div className="flex gap-1.5">
          {players.map((player) => {
            const seat = ludo?.players?.[player.id];
            return (
              <span
                key={player.id}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 border border-white/10 text-[10px] font-black"
              >
                <span style={{ backgroundColor: player.color }} className="w-2 h-2 rounded-full" />
                {seat ? `${seat.finishedCount}/4` : "0/4"}
              </span>
            );
          })}
        </div>
        <TurnBanner
          name={gameState.players[activePlayerId]?.name}
          color={gameState.players[activePlayerId]?.color}
          text="دور"
        />
        <span className="hidden sm:block text-[10px] text-white/35 font-bold">
          {isSpectator ? "وضع المتفرج" : "اختر قطعتك من الجوال عند ظهور النرد"}
        </span>
      </footer>
    </div>
  );
}
