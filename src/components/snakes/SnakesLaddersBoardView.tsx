"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Compass,
  Mountain,
  ShieldAlert,
  Footprints,
  Info,
  X,
  ChevronsUp,
  ChevronsDown,
  Flame,
  Crown
} from "lucide-react";
import type { FullRoomState } from "@/game/gameRoom";
import { getPlayerInitial } from "@/utils/playerDisplay";
import RealisticDice3D from "@/components/common/RealisticDice3D";
import WoodTabletopEnvironment from "@/components/common/WoodTabletopEnvironment";
import { sfx } from "@/utils/soundEffects";
import {
  LADDERS as CONFIG_LADDERS,
  SNAKES as CONFIG_SNAKES,
  BIOMES,
  getBiomeForSquare,
  formatSquareNumber,
  getSquareCoordinates,
  LadderDef,
  SnakeDef,
  BiomeDef
} from "./snakesConfig";

export interface SnakesLaddersBoardViewProps {
  gameState: FullRoomState;
  visualPositions: Record<string, number>;
  activePlayerId: string;
  isRollingDice: boolean;
  displayedDice: number | null;
}

// Backward-compatible record maps for external components
export const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91
};

export const SNAKES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78
};

// Coordinate mapper for 10x10 zigzag grid (squares 1 to 100)
// Square 1 is at bottom-left (row 10, col 1). Square 100 is at top-left (row 1, col 1).
export function getSnakeGridPos(squareNumber: number): { row: number; col: number } {
  const sq = Math.max(1, Math.min(100, squareNumber));
  const zeroIdx = sq - 1;
  const rowFromBottom = Math.floor(zeroIdx / 10);
  const row = 10 - rowFromBottom;

  const isLeftToRight = rowFromBottom % 2 === 0;
  const colInRow = zeroIdx % 10;
  const col = isLeftToRight ? colInRow + 1 : 10 - colInRow;

  return { row, col };
}

// Procedural Bezier Curve Generator for Winding Snakes
interface SnakeSpline {
  d: string;
  head: { cx: number; cy: number };
  tail: { cx: number; cy: number };
  headAngleDeg: number;
}

function generateSnakeSpline(
  fromSq: number,
  toSq: number,
  waveCount: number = 2.5,
  waveAmp: number = 28
): SnakeSpline {
  const head = getSquareCoordinates(fromSq);
  const tail = getSquareCoordinates(toSq);
  const dx = tail.cx - head.cx;
  const dy = tail.cy - head.cy;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const numPoints = Math.max(16, Math.round(dist / 22));
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const env = Math.sin(t * Math.PI);
    const wave =
      Math.sin(t * Math.PI * 2 * waveCount) +
      0.22 * Math.sin(t * Math.PI * 4 * waveCount);
    const lateral = wave * waveAmp * env;
    points.push({
      x: head.cx + t * dx + nx * lateral,
      y: head.cy + t * dy + ny * lateral
    });
  }

  // Catmull-Rom to Cubic Bezier Conversion
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  // Tangent at head facing outward/menacingly
  const tangent = {
    x: points[1].x - points[0].x,
    y: points[1].y - points[0].y
  };
  const headAngleDeg = (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI + 180;

  return { d, head, tail, headAngleDeg };
}

// Procedural Geometry Generator for Wooden Rope Ladders
interface LadderGeometry {
  leftRail: { x1: number; y1: number; x2: number; y2: number };
  rightRail: { x1: number; y1: number; x2: number; y2: number };
  rungs: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    leftKnot: { x: number; y: number };
    rightKnot: { x: number; y: number };
    t: number;
  }[];
  base: { cx: number; cy: number };
  top: { cx: number; cy: number };
  length: number;
}

function generateLadderGeometry(
  fromSq: number,
  toSq: number,
  halfWidth: number = 14
): LadderGeometry {
  const base = getSquareCoordinates(fromSq);
  const top = getSquareCoordinates(toSq);
  const dx = top.cx - base.cx;
  const dy = top.cy - base.cy;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  // Rail extensions slightly past rungs
  const ext = 8;
  const bxExt = base.cx - ux * ext;
  const byExt = base.cy - uy * ext;
  const txExt = top.cx + ux * ext;
  const tyExt = top.cy + uy * ext;

  const leftRail = {
    x1: bxExt - nx * halfWidth,
    y1: byExt - ny * halfWidth,
    x2: txExt - nx * halfWidth,
    y2: tyExt - ny * halfWidth
  };

  const rightRail = {
    x1: bxExt + nx * halfWidth,
    y1: byExt + ny * halfWidth,
    x2: txExt + nx * halfWidth,
    y2: tyExt + ny * halfWidth
  };

  const numRungs = Math.max(3, Math.floor(dist / 28));
  const rungs: LadderGeometry["rungs"] = [];
  for (let k = 1; k <= numRungs; k++) {
    const t = k / (numRungs + 1);
    const rcx = base.cx + t * dx;
    const rcy = base.cy + t * dy;

    const leftKnot = {
      x: rcx - nx * halfWidth,
      y: rcy - ny * halfWidth
    };
    const rightKnot = {
      x: rcx + nx * halfWidth,
      y: rcy + ny * halfWidth
    };

    rungs.push({
      x1: rcx - nx * (halfWidth + 2),
      y1: rcy - ny * (halfWidth + 2),
      x2: rcx + nx * (halfWidth + 2),
      y2: rcy + ny * (halfWidth + 2),
      leftKnot,
      rightKnot,
      t
    });
  }

  return { leftRail, rightRail, rungs, base, top, length: dist };
}

export default function SnakesLaddersBoardView({
  gameState,
  visualPositions,
  activePlayerId,
  isRollingDice,
  displayedDice
}: SnakesLaddersBoardViewProps) {
  const activePlayer = gameState.players[activePlayerId];

  // Currently inspected square for lore and tips
  const [inspectedSquare, setInspectedSquare] = useState<number | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Audio trigger on visual movement & special square lands
  const prevPosRef = useRef<Record<string, number>>({});
  useEffect(() => {
    for (const [id, pos] of Object.entries(visualPositions)) {
      const prev = prevPosRef.current[id];
      if (prev !== undefined && prev !== pos) {
        const targetSq = pos + 1;
        if (LADDERS[targetSq]) {
          sfx.playLadderAscent();
        } else if (SNAKES[targetSq]) {
          sfx.playSnakeSlide();
        } else if (targetSq === 100) {
          sfx.playVictoryFanfare();
        }
      }
    }
    prevPosRef.current = { ...visualPositions };
  }, [visualPositions]);

  // Precompute procedural snakes
  const proceduralSnakes = useMemo(() => {
    return CONFIG_SNAKES.map((s) => ({
      def: s,
      spline: generateSnakeSpline(s.from, s.to, s.waveCount ?? 2.5, s.waveAmp ?? 28)
    }));
  }, []);

  // Precompute procedural wooden ladders
  const proceduralLadders = useMemo(() => {
    return CONFIG_LADDERS.map((l) => ({
      def: l,
      geom: generateLadderGeometry(l.from, l.to, l.isGiant ? 16 : 13)
    }));
  }, []);

  // Winding expedition trail path connecting all 100 squares
  const expeditionTrailPath = useMemo(() => {
    let d = "";
    for (let sq = 1; sq <= 100; sq++) {
      const { cx, cy } = getSquareCoordinates(sq);
      if (sq === 1) {
        d += `M ${cx} ${cy}`;
      } else {
        d += ` L ${cx} ${cy}`;
      }
    }
    return d;
  }, []);

  // Group players by current visual square to compute anti-overlap offsets
  const playerCoordinates = useMemo(() => {
    const allPlayers = Object.values(gameState.players);
    const bySquare: Record<number, typeof allPlayers> = {};

    for (const p of allPlayers) {
      const visualPos = visualPositions[p.id] ?? p.position;
      const sq = Math.max(1, Math.min(100, visualPos + 1));
      if (!bySquare[sq]) bySquare[sq] = [];
      bySquare[sq].push(p);
    }

    const coords: Record<
      string,
      { x: number; y: number; sq: number; isSolo: boolean }
    > = {};

    for (const [sqStr, playersOnSq] of Object.entries(bySquare)) {
      const sq = Number(sqStr);
      const { cx, cy } = getSquareCoordinates(sq);
      const total = playersOnSq.length;

      playersOnSq.forEach((p, idx) => {
        let offsetX = 0;
        let offsetY = 6;

        if (total === 2) {
          offsetX = idx === 0 ? -16 : 16;
        } else if (total === 3) {
          const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
          offsetX = Math.cos(angles[idx]) * 16;
          offsetY = 6 + Math.sin(angles[idx]) * 14;
        } else if (total >= 4) {
          const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
          offsetX = Math.cos(angle) * 18;
          offsetY = 6 + Math.sin(angle) * 16;
        }

        coords[p.id] = {
          x: cx + offsetX,
          y: cy + offsetY,
          sq,
          isSolo: total === 1
        };
      });
    }

    return coords;
  }, [gameState.players, visualPositions]);

  // Information about currently inspected square
  const inspectedData = useMemo(() => {
    if (!inspectedSquare) return null;
    const biome = getBiomeForSquare(inspectedSquare);
    const ladder = CONFIG_LADDERS.find((l) => l.from === inspectedSquare);
    const snake = CONFIG_SNAKES.find((s) => s.from === inspectedSquare);
    const ladderTop = CONFIG_LADDERS.find((l) => l.to === inspectedSquare);
    const snakeTail = CONFIG_SNAKES.find((s) => s.to === inspectedSquare);

    return {
      square: inspectedSquare,
      biome,
      ladder,
      snake,
      ladderTop,
      snakeTail
    };
  }, [inspectedSquare]);

  return (
    <WoodTabletopEnvironment
      variant="darkOak"
      showPlanks={true}
      showSpotlight={true}
      className="p-2 md:p-4 flex items-center justify-center overflow-hidden"
    >
      <div className="w-full h-full max-w-6xl max-h-[82vh] mx-auto p-2.5 sm:p-4 bg-[#1e140d]/90 rounded-3xl border-4 border-[#3d2817] shadow-[0_20px_70px_rgba(0,0,0,0.95)] flex flex-col lg:flex-row gap-3 sm:gap-4 select-none relative font-sans overflow-hidden z-10">
        {/* 1. Main Illustrated Expedition Map Board (SVG 1000x1000) */}
      <div className="flex-1 aspect-square rounded-2xl bg-[#120e09] border-2 border-[#332415] shadow-2xl relative overflow-hidden flex items-center justify-center p-1 sm:p-2">
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            @keyframes tongueFlick {
              0%, 100% { transform: scale(1); opacity: 0.85; }
              25% { transform: scale(1.3) rotate(5deg); opacity: 1; }
              50% { transform: scale(0.9) rotate(-4deg); opacity: 0.9; }
              75% { transform: scale(1.4) rotate(3deg); opacity: 1; }
            }
            .snake-tongue {
              transform-origin: center top;
              animation: tongueFlick 1.8s ease-in-out infinite;
            }
            @keyframes eyeGlow {
              0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 2px #FBBF24); }
              50% { opacity: 1; filter: drop-shadow(0 0 5px #EF4444); }
            }
            .snake-eye {
              animation: eyeGlow 2.5s ease-in-out infinite;
            }
            @keyframes rotateCompass {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .compass-subtle {
              transform-origin: 500px 500px;
            }
          `}</style>

          <defs>
            {/* Filters */}
            <filter id="map-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.7" />
            </filter>
            <filter id="snake-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="4" dy="7" stdDeviation="6" floodColor="#000000" floodOpacity="0.75" />
            </filter>
            <filter id="ladder-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="5" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.7" />
            </filter>
            <filter id="pawn-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
            </filter>

            {/* Antique Parchment Map Gradients */}
            <radialGradient id="parchment-base" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#251b12" />
              <stop offset="60%" stopColor="#1a130c" />
              <stop offset="100%" stopColor="#0d0905" />
            </radialGradient>

            <radialGradient id="parchment-vignette" cx="50%" cy="50%" r="65%">
              <stop offset="70%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.85)" />
            </radialGradient>

            {/* Oasis Water Spring */}
            <radialGradient id="oasis-water" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </radialGradient>

            {/* Dragon Shrine Golden Sunburst */}
            <radialGradient id="dragon-sunburst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
            </radialGradient>

            {/* Snake Danger Aura */}
            <radialGradient id="snake-aura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#dc2626" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
            </radialGradient>

            {/* Dynamic Player Pawn Jewel Gradients */}
            {Object.values(gameState.players).map((p) => (
              <radialGradient
                key={`pawn-grad-${p.id}`}
                id={`pawn-gem-${p.id}`}
                cx="35%"
                cy="35%"
                r="65%"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="35%" stopColor={p.color} stopOpacity="0.9" />
                <stop offset="85%" stopColor={p.color} stopOpacity="1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
              </radialGradient>
            ))}

            {/* Dynamic Snake Body Gradients */}
            {CONFIG_SNAKES.map((s) => (
              <React.Fragment key={`snake-defs-${s.from}`}>
                <linearGradient
                  id={`snake-body-${s.from}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={s.secondaryColor ?? "#064E3B"} />
                  <stop offset="35%" stopColor={s.color} />
                  <stop offset="70%" stopColor={s.secondaryColor ?? "#064E3B"} />
                  <stop offset="100%" stopColor={s.color} />
                </linearGradient>
                <linearGradient
                  id={`snake-belly-${s.from}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={s.bellyColor} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
                </linearGradient>
              </React.Fragment>
            ))}
          </defs>

          {/* ========================================================
              LAYER 1: ANCIENT EXPEDITION PARCHMENT TERRAIN & CARTOGRAPHY
              ======================================================== */}
          {/* Base Aged Map Parchment */}
          <rect x="8" y="8" width="984" height="984" rx="26" fill="url(#parchment-base)" />
          <rect
            x="8"
            y="8"
            width="984"
            height="984"
            rx="26"
            fill="url(#parchment-vignette)"
          />

          {/* Ancient Map Frame & Brass Reinforcement Corners */}
          <rect
            x="20"
            y="20"
            width="960"
            height="960"
            rx="20"
            fill="none"
            stroke="#785328"
            strokeWidth="3"
            opacity="0.4"
          />
          <rect
            x="26"
            y="26"
            width="948"
            height="948"
            rx="16"
            fill="none"
            stroke="#d97706"
            strokeWidth="1.2"
            strokeDasharray="6,4"
            opacity="0.3"
          />

          {/* Brass Corner Filigrees with Rivets */}
          {[
            { cx: 32, cy: 32 },
            { cx: 968, cy: 32 },
            { cx: 32, cy: 968 },
            { cx: 968, cy: 968 }
          ].map((corner, cIdx) => (
            <g key={`corner-${cIdx}`}>
              <circle
                cx={corner.cx}
                cy={corner.cy}
                r="10"
                fill="#92400e"
                stroke="#f59e0b"
                strokeWidth="2"
                opacity="0.75"
              />
              <circle cx={corner.cx} cy={corner.cy} r="3" fill="#fbbf24" />
            </g>
          ))}

          {/* Topographic Elevation Contour Lines */}
          <g opacity="0.13" stroke="#d97706" strokeWidth="1.2" fill="none">
            <path d="M 15 920 Q 250 870, 500 910 T 985 860" />
            <path d="M 15 760 Q 300 710, 600 770 T 985 710" />
            <path d="M 15 570 Q 220 620, 500 540 T 985 580" />
            <path d="M 15 390 Q 380 340, 720 410 T 985 360" />
            <path d="M 15 210 Q 320 260, 680 180 T 985 230" />
            <path d="M 15 70 Q 260 120, 500 60 T 985 90" />
          </g>

          {/* Ancient Nautical Compass Rose Watermark */}
          <g className="compass-subtle" opacity="0.14">
            <circle
              cx="500"
              cy="500"
              r="140"
              fill="none"
              stroke="#b45309"
              strokeWidth="2"
            />
            <circle
              cx="500"
              cy="500"
              r="115"
              fill="none"
              stroke="#b45309"
              strokeWidth="1"
              strokeDasharray="4,6"
            />
            {/* 16 Degree Radial Ticks */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i * Math.PI) / 8;
              const x1 = 500 + Math.cos(angle) * 115;
              const y1 = 500 + Math.sin(angle) * 115;
              const x2 = 500 + Math.cos(angle) * 140;
              const y2 = 500 + Math.sin(angle) * 140;
              return (
                <line
                  key={`tick-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#d97706"
                  strokeWidth="1.5"
                />
              );
            })}
            {/* 8-Point Compass Star */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI) / 4;
              const nextAngle = ((i + 1) * Math.PI) / 4;
              const tipX = 500 + Math.cos(angle) * 110;
              const tipY = 500 + Math.sin(angle) * 110;
              const midAngle = angle + Math.PI / 8;
              const midX = 500 + Math.cos(midAngle) * 45;
              const midY = 500 + Math.sin(midAngle) * 45;

              return (
                <g key={`star-point-${i}`}>
                  <polygon
                    points={`500,500 ${tipX},${tipY} ${midX},${midY}`}
                    fill="#f59e0b"
                  />
                  <polygon
                    points={`500,500 ${midX},${midY} ${500 + Math.cos(nextAngle) * 110},${
                      500 + Math.sin(nextAngle) * 110
                    }`}
                    fill="#78350f"
                  />
                </g>
              );
            })}
            {/* Cardinal Calligraphy */}
            <text
              x="500"
              y="370"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="22"
              fontWeight="900"
              fontFamily="serif"
            >
              شمال (N)
            </text>
            <text
              x="500"
              y="650"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="22"
              fontWeight="900"
              fontFamily="serif"
            >
              جنوب (S)
            </text>
            <text
              x="635"
              y="508"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="22"
              fontWeight="900"
              fontFamily="serif"
            >
              شرق (E)
            </text>
            <text
              x="365"
              y="508"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="22"
              fontWeight="900"
              fontFamily="serif"
            >
              غرب (W)
            </text>
          </g>

          {/* ========================================================
              LAYER 2: THE WINDING EXPEDITION FOOT TRAIL
              ======================================================== */}
          <path
            d={expeditionTrailPath}
            fill="none"
            stroke="#a16207"
            strokeWidth="2.5"
            strokeDasharray="6,8"
            opacity="0.32"
          />

          {/* ========================================================
              LAYER 3: THE 100 CARVED ANCIENT STEPPING STONES
              ======================================================== */}
          {Array.from({ length: 100 }).map((_, idx) => {
            const sq = idx + 1;
            const { cx, cy } = getSquareCoordinates(sq);
            const biome = getBiomeForSquare(sq);
            const isLadderStart = LADDERS[sq] !== undefined;
            const isSnakeStart = SNAKES[sq] !== undefined;
            const isLadderTop = CONFIG_LADDERS.some((l) => l.to === sq);
            const isSnakeTail = CONFIG_SNAKES.some((s) => s.to === sq);
            const isInspected = inspectedSquare === sq;
            const isDragonThrone = sq === 100;
            const isOasisCamp = sq === 1;

            const { ar, en } = formatSquareNumber(sq);
            const stoneW = 86;
            const stoneH = 86;
            const stoneX = cx - stoneW / 2;
            const stoneY = cy - stoneH / 2;

            return (
              <g
                key={`stone-${sq}`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => setInspectedSquare(sq)}
              >
                {/* Stone Cast Shadow */}
                <rect
                  x={stoneX + 3}
                  y={stoneY + 4}
                  width={stoneW}
                  height={stoneH}
                  rx="12"
                  fill="rgba(0,0,0,0.65)"
                  filter="url(#map-shadow)"
                />

                {/* Carved Stone Flagstone Base */}
                <rect
                  x={stoneX}
                  y={stoneY}
                  width={stoneW}
                  height={stoneH}
                  rx="12"
                  fill={
                    isDragonThrone
                      ? "url(#dragon-sunburst)"
                      : biome.stoneGradient[0]
                  }
                  stroke={
                    isInspected
                      ? "#fbbf24"
                      : isDragonThrone
                      ? "#f59e0b"
                      : isLadderStart
                      ? "#10b981"
                      : isSnakeStart
                      ? "#ef4444"
                      : biome.stoneBorder
                  }
                  strokeWidth={isInspected ? 3 : isDragonThrone ? 2.5 : 1.5}
                />

                {/* 3D Stone Bevel Highlight on Top-Left */}
                <path
                  d={`M ${stoneX + 4} ${stoneY + stoneH - 4} L ${stoneX + 4} ${
                    stoneY + 4
                  } L ${stoneX + stoneW - 4} ${stoneY + 4}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.5"
                />

                {/* Subtle Weathering Chisel Crack Line on Selected Stones */}
                {(sq % 9 === 0 || sq % 13 === 0) && !isDragonThrone && (
                  <path
                    d={`M ${stoneX + 18} ${stoneY + 22} L ${stoneX + 26} ${
                      stoneY + 34
                    } L ${stoneX + 32} ${stoneY + 40}`}
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth="1"
                    fill="none"
                  />
                )}

                {/* Numerals: Latin (left) + Arabic-Indic (right) */}
                <text
                  x={stoneX + 12}
                  y={stoneY + 20}
                  fill={isDragonThrone ? "#451a03" : biome.textColor}
                  fontSize="12"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {en}
                </text>
                <text
                  x={stoneX + stoneW - 12}
                  y={stoneY + 20}
                  textAnchor="end"
                  fill={isDragonThrone ? "#78350f" : biome.accentColor}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="sans-serif"
                  opacity="0.8"
                >
                  {ar}
                </text>

                {/* Landmark Vignette: Square 1 (Base Camp Oasis) */}
                {isOasisCamp && (
                  <g transform={`translate(${cx}, ${cy + 6})`}>
                    <circle r="16" fill="url(#oasis-water)" opacity="0.85" />
                    <circle r="7" fill="#38bdf8" opacity="0.6" />
                    <text
                      x="0"
                      y="26"
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="9"
                      fontWeight="900"
                    >
                      واحة البداية 🌴
                    </text>
                  </g>
                )}

                {/* Landmark Vignette: Square 100 (The Golden Dragon Citadel) */}
                {isDragonThrone && (
                  <g transform={`translate(${cx}, ${cy + 4})`}>
                    <circle r="26" fill="url(#dragon-sunburst)" opacity="0.6" />
                    <Trophy className="w-6 h-6 text-amber-950" x="-12" y="-14" />
                    <Crown className="w-4 h-4 text-amber-800" x="-8" y="-24" />
                    <text
                      x="0"
                      y="26"
                      textAnchor="middle"
                      fill="#78350f"
                      fontSize="9"
                      fontWeight="900"
                    >
                      عرش النصر 👑
                    </text>
                  </g>
                )}

                {/* Ladder Base Anchor Glyph */}
                {isLadderStart && !isDragonThrone && (
                  <g transform={`translate(${cx}, ${cy + 10})`}>
                    <circle r="11" fill="rgba(16,185,129,0.25)" />
                    <ChevronsUp className="w-4 h-4 text-emerald-400" x="-8" y="-9" />
                    <text
                      x="0"
                      y="18"
                      textAnchor="middle"
                      fill="#6ee7b7"
                      fontSize="9"
                      fontWeight="900"
                    >
                      +{LADDERS[sq] - sq} 🪜
                    </text>
                  </g>
                )}

                {/* Snake Head Danger Skull Glyph */}
                {isSnakeStart && !isDragonThrone && (
                  <g transform={`translate(${cx}, ${cy + 10})`}>
                    <circle r="11" fill="rgba(239,68,68,0.25)" />
                    <ChevronsDown className="w-4 h-4 text-rose-400" x="-8" y="-9" />
                    <text
                      x="0"
                      y="18"
                      textAnchor="middle"
                      fill="#fca5a5"
                      fontSize="9"
                      fontWeight="900"
                    >
                      -{sq - SNAKES[sq]} 🐍
                    </text>
                  </g>
                )}

                {/* Ladder Top / Snake Tail landing markers */}
                {isLadderTop && !isLadderStart && (
                  <g transform={`translate(${cx}, ${cy + 10})`}>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" x="-7" y="-7" />
                    <text
                      x="0"
                      y="16"
                      textAnchor="middle"
                      fill="#fcd34d"
                      fontSize="8"
                      fontWeight="800"
                    >
                      وصول السلم
                    </text>
                  </g>
                )}
                {isSnakeTail && !isSnakeStart && !isOasisCamp && (
                  <g transform={`translate(${cx}, ${cy + 10})`}>
                    <Footprints className="w-3 h-3 text-rose-400/80" x="-6" y="-6" />
                    <text
                      x="0"
                      y="16"
                      textAnchor="middle"
                      fill="#fda4af"
                      fontSize="8"
                      fontWeight="800"
                    >
                      منزلق الثعبان
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ========================================================
              LAYER 4: PROCEDURAL WOODEN ROPE LADDERS
              ======================================================== */}
          {proceduralLadders.map(({ def, geom }) => (
            <g
              key={`procedural-ladder-${def.from}`}
              className="cursor-pointer group"
              onClick={() => setInspectedSquare(def.from)}
            >
              {/* Ladder Cast Shadow */}
              <line
                x1={geom.leftRail.x1 + 6}
                y1={geom.leftRail.y1 + 9}
                x2={geom.leftRail.x2 + 6}
                y2={geom.leftRail.y2 + 9}
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="10"
                strokeLinecap="round"
                filter="url(#ladder-shadow)"
              />
              <line
                x1={geom.rightRail.x1 + 6}
                y1={geom.rightRail.y1 + 9}
                x2={geom.rightRail.x2 + 6}
                y2={geom.rightRail.y2 + 9}
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="10"
                strokeLinecap="round"
                filter="url(#ladder-shadow)"
              />

              {/* Main Left Timber Rail */}
              <line
                x1={geom.leftRail.x1}
                y1={geom.leftRail.y1}
                x2={geom.leftRail.x2}
                y2={geom.leftRail.y2}
                stroke={def.woodColor ?? "#78350F"}
                strokeWidth="9"
                strokeLinecap="round"
              />
              <line
                x1={geom.leftRail.x1}
                y1={geom.leftRail.y1}
                x2={geom.leftRail.x2}
                y2={geom.leftRail.y2}
                stroke={def.woodLight ?? "#B45309"}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Main Right Timber Rail */}
              <line
                x1={geom.rightRail.x1}
                y1={geom.rightRail.y1}
                x2={geom.rightRail.x2}
                y2={geom.rightRail.y2}
                stroke={def.woodColor ?? "#78350F"}
                strokeWidth="9"
                strokeLinecap="round"
              />
              <line
                x1={geom.rightRail.x1}
                y1={geom.rightRail.y1}
                x2={geom.rightRail.x2}
                y2={geom.rightRail.y2}
                stroke={def.woodLight ?? "#B45309"}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Wooden Rungs & Hemp Rope Lashings */}
              {geom.rungs.map((rung, rIdx) => (
                <g key={`rung-${def.from}-${rIdx}`}>
                  {/* Rung Shadow */}
                  <line
                    x1={rung.x1 + 4}
                    y1={rung.y1 + 6}
                    x2={rung.x2 + 4}
                    y2={rung.y2 + 6}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Rung Timber */}
                  <line
                    x1={rung.x1}
                    y1={rung.y1}
                    x2={rung.x2}
                    y2={rung.y2}
                    stroke={def.woodColor ?? "#78350F"}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <line
                    x1={rung.x1}
                    y1={rung.y1}
                    x2={rung.x2}
                    y2={rung.y2}
                    stroke={def.woodLight ?? "#D97706"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  {/* Left Joint Hemp Rope Lashing */}
                  <circle
                    cx={rung.leftKnot.x}
                    cy={rung.leftKnot.y}
                    r="3.2"
                    fill="#92400e"
                    stroke={def.ropeColor ?? "#F59E0B"}
                    strokeWidth="1.2"
                  />
                  {/* Right Joint Hemp Rope Lashing */}
                  <circle
                    cx={rung.rightKnot.x}
                    cy={rung.rightKnot.y}
                    r="3.2"
                    fill="#92400e"
                    stroke={def.ropeColor ?? "#F59E0B"}
                    strokeWidth="1.2"
                  />
                </g>
              ))}

              {/* Ascending Golden Light Sparkles */}
              {geom.rungs
                .filter((_, idx) => idx % 3 === 0)
                .map((rung, sIdx) => {
                  const cx = (rung.x1 + rung.x2) / 2;
                  const cy = (rung.y1 + rung.y2) / 2;
                  return (
                    <polygon
                      key={`sparkle-${def.from}-${sIdx}`}
                      points={`${cx},${cy - 5} ${cx - 3},${cy + 2} ${cx + 3},${cy + 2}`}
                      fill="#FDE047"
                      opacity="0.8"
                    />
                  );
                })}
            </g>
          ))}

          {/* ========================================================
              LAYER 5: PROCEDURAL WINDING SERPENTS (REAL SNAKES)
              ======================================================== */}
          {proceduralSnakes.map(({ def, spline }) => (
            <g
              key={`procedural-snake-${def.from}`}
              className="cursor-pointer group"
              onClick={() => setInspectedSquare(def.from)}
            >
              {/* Snake Underbelly Cast Shadow */}
              <path
                d={spline.d}
                fill="none"
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="24"
                strokeLinecap="round"
                transform="translate(4, 8)"
                filter="url(#snake-shadow)"
              />

              {/* Snake Body Base Tube */}
              <path
                d={spline.d}
                fill="none"
                stroke={`url(#snake-body-${def.from})`}
                strokeWidth="19"
                strokeLinecap="round"
              />

              {/* Segmented Reptile Ventral Plates */}
              <path
                d={spline.d}
                fill="none"
                stroke={`url(#snake-belly-${def.from})`}
                strokeWidth="8"
                strokeLinecap="butt"
                strokeDasharray="9,5"
              />

              {/* Dorsal Diamond & Scale Markings */}
              <path
                d={spline.d}
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray="2,16"
              />

              {/* Coiled Tapering Tail at Target Square */}
              <g transform={`translate(${spline.tail.cx}, ${spline.tail.cy})`}>
                <path
                  d="M 0 0 C 10 5, 14 14, 8 20 C 0 24, -12 16, -10 6 C -8 -4, 2 -8, 8 -4"
                  fill="none"
                  stroke={def.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  filter="url(#snake-shadow)"
                />
                <path
                  d="M 0 0 C 10 5, 14 14, 8 20 C 0 24, -12 16, -10 6 C -8 -4, 2 -8, 8 -4"
                  fill="none"
                  stroke={def.bellyColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="-4" r="3.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                <circle cx="11" cy="-2" r="2.5" fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />
              </g>

              {/* Detailed Viper / Cobra Head at Start Square */}
              <g
                transform={`translate(${spline.head.cx}, ${spline.head.cy}) rotate(${spline.headAngleDeg})`}
              >
                {/* Danger Aura Circle */}
                <circle r="22" fill="url(#snake-aura)" opacity="0.65" />

                {/* Cobra Hood Flaring */}
                <path
                  d="M 0 -6 C -15 -10 -17 8 -9 15 C -4 19 4 19 9 15 C 17 8 15 -10 0 -6 Z"
                  fill={def.secondaryColor ?? "#064E3B"}
                  stroke={def.color}
                  strokeWidth="1.5"
                  filter="url(#snake-shadow)"
                />

                {/* Triangular Viper Head Skull */}
                <path
                  d="M 0 -17 L -10 -2 L -6 12 L 6 12 L 10 -2 Z"
                  fill={def.color}
                  stroke={def.secondaryColor ?? "#022C22"}
                  strokeWidth="1.5"
                />

                {/* Forehead Scales Diamond */}
                <polygon
                  points="0,-13 -4,-7 0,-3 4,-7"
                  fill="rgba(255,255,255,0.3)"
                />

                {/* Menacing Eyes with Slit Pupil */}
                <ellipse
                  cx="-6"
                  cy="-3"
                  rx="3.2"
                  ry="1.9"
                  fill={def.eyeColor ?? "#FDE047"}
                  transform="rotate(-15 -6 -3)"
                  className="snake-eye"
                />
                <line
                  x1="-6"
                  y1="-4.6"
                  x2="-6"
                  y2="-1.4"
                  stroke="#000000"
                  strokeWidth="1.2"
                />
                <circle cx="-6.8" cy="-3.6" r="0.7" fill="#FFFFFF" />

                <ellipse
                  cx="6"
                  cy="-3"
                  rx="3.2"
                  ry="1.9"
                  fill={def.eyeColor ?? "#FDE047"}
                  transform="rotate(15 6 -3)"
                  className="snake-eye"
                />
                <line
                  x1="6"
                  y1="-4.6"
                  x2="6"
                  y2="-1.4"
                  stroke="#000000"
                  strokeWidth="1.2"
                />
                <circle cx="5.2" cy="-3.6" r="0.7" fill="#FFFFFF" />

                {/* Curved Ivory Fangs */}
                <path
                  d="M -4.5 -17 Q -5.5 -22 -3.5 -25 Q -2.8 -21 -2.8 -17 Z"
                  fill="#FFFDF0"
                  stroke="#78350F"
                  strokeWidth="0.5"
                />
                <path
                  d="M 4.5 -17 Q 5.5 -22 3.5 -25 Q 2.8 -21 2.8 -17 Z"
                  fill="#FFFDF0"
                  stroke="#78350F"
                  strokeWidth="0.5"
                />

                {/* Flickering Red Forked Tongue */}
                <g className="snake-tongue">
                  <path
                    d="M 0 -17 L 0 -27 L -3.5 -32 M 0 -27 L 3.5 -32"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>
              </g>
            </g>
          ))}

          {/* ========================================================
              LAYER 6: 3D ADVENTURE EXPLORER PAWNS (JEWEL TOKENS)
              ======================================================== */}
          {Object.values(gameState.players).map((p) => {
            const pos = playerCoordinates[p.id];
            if (!pos) return null;
            const isTurn = p.id === activePlayerId;

            return (
              <motion.g
                key={`pawn-group-${p.id}`}
                animate={{ x: pos.x, y: pos.y }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 24,
                  mass: 0.8
                }}
              >
                {/* Pawn Ground Shadow */}
                <ellipse
                  cx="0"
                  cy="14"
                  rx={isTurn ? 16 : 14}
                  ry={isTurn ? 7 : 6}
                  fill="rgba(0,0,0,0.55)"
                  filter="url(#pawn-shadow)"
                />

                {/* Active Player Pulsing Halo Ring */}
                {isTurn && (
                  <>
                    <circle
                      cx="0"
                      cy="0"
                      r="20"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                      strokeDasharray="5,4"
                      className="animate-spin"
                      style={{ animationDuration: "6s" }}
                    />
                    <Crown
                      className="w-4 h-4 text-amber-400"
                      x="-8"
                      y="-26"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
                    />
                  </>
                )}

                {/* Gilded Brass Outer Bezel */}
                <circle
                  cx="0"
                  cy="0"
                  r="14"
                  fill="#b45309"
                  stroke="#fde047"
                  strokeWidth="2"
                  filter="url(#map-shadow)"
                />

                {/* 3D Spherical Gemstone Core */}
                <circle
                  cx="0"
                  cy="0"
                  r="12"
                  fill={`url(#pawn-gem-${p.id})`}
                />

                {/* Glass Specular Reflection Highlight Arc */}
                <path
                  d="M -7 -4 A 8 8 0 0 1 5 -7"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Explorer Initial Monogram */}
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="900"
                  fontFamily="sans-serif"
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))"
                >
                  {getPlayerInitial(p.name)}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* 2. Side Panel: 3D Dice Tray & Field Explorer Console */}
      <div className="w-full lg:w-80 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#141829] to-[#0d101c] border-2 border-[#2b354e] shadow-xl text-center overflow-y-auto max-h-[38vh] lg:max-h-none">
        {/* Header Badge */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black mb-2 shadow-inner">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "12s" }} />
            <span>خريطة المغامرة القديمة 100</span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-1">
            <div
              className="w-3.5 h-3.5 rounded-full border border-white shadow"
              style={{ backgroundColor: activePlayer?.color }}
            />
            <h3 className="text-base sm:text-lg font-black text-white">
              دور: <span style={{ color: activePlayer?.color }}>{activePlayer?.name}</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRollingDice ? "ترقب نتيجة النرد العتيق..." : "ارمِ النرد للصعود نحو الـ 100!"}
          </p>
        </div>

        {/* 3D Dice Tray */}
        <div className="my-2.5 flex justify-center py-2 px-3 rounded-2xl bg-gradient-to-b from-[#1c140e] to-[#0f0b08] border-2 border-[#523821] shadow-inner relative">
          <RealisticDice3D
            values={displayedDice ? [displayedDice] : [1]}
            isRolling={isRollingDice}
            size="md"
          />
        </div>

        {/* Interactive Inspection Card (when player taps any square or obstacle) */}
        <AnimatePresence>
          {inspectedData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-right text-xs space-y-1 relative shadow-lg"
            >
              <button
                onClick={() => setInspectedSquare(null)}
                className="absolute top-2 left-2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 font-black text-amber-300">
                <span>{inspectedData.biome.icon}</span>
                <span>المربع #{inspectedData.square}</span>
                <span className="text-[10px] text-amber-200/70">({inspectedData.biome.nameAr})</span>
              </div>

              {inspectedData.ladder && (
                <div className="text-emerald-300 font-bold text-[11px] leading-tight">
                  🪜 {inspectedData.ladder.nameAr}
                  <p className="text-slate-300 font-normal text-[10px] mt-0.5">
                    {inspectedData.ladder.loreAr}
                  </p>
                </div>
              )}

              {inspectedData.snake && (
                <div className="text-rose-300 font-bold text-[11px] leading-tight">
                  🐍 {inspectedData.snake.nameAr}
                  <p className="text-slate-300 font-normal text-[10px] mt-0.5">
                    {inspectedData.snake.loreAr}
                  </p>
                </div>
              )}

              {inspectedData.square === 100 && (
                <div className="text-amber-300 font-bold text-[11px]">
                  👑 قمة المجد وعرش التنين الذهبي! من يصل أولاً يحسم النصر الأبدي!
                </div>
              )}

              {inspectedData.square === 1 && (
                <div className="text-sky-300 font-bold text-[11px]">
                  🌴 واحة البداية: منبع الينبوع ونقطة انطلاق المستكشفين الأبطال.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Altitude Leaderboard & Biome Gauge */}
        <div className="space-y-1.5 text-right">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-1">
            <span className="text-[11px] text-amber-400 font-mono">
              8 سلالم 🪜 | 8 ثعابين 🐍
            </span>
            <div className="flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              <span>ارتفاع المتسابقين 🏔️</span>
            </div>
          </div>

          {Object.values(gameState.players)
            .map((p) => {
              const visual = (visualPositions[p.id] ?? p.position) + 1;
              return { player: p, visual };
            })
            .sort((a, b) => b.visual - a.visual)
            .map(({ player: p, visual }, rankIdx) => {
              const isTurn = p.id === activePlayerId;
              const biome = getBiomeForSquare(visual);
              const rankMedals = ["🥇", "🥈", "🥉", "🏅"];

              // Check if nearby threat or opportunity
              let proximityBadge = null;
              for (let step = 1; step <= 6; step++) {
                const nextSq = visual + step;
                if (LADDERS[nextSq]) {
                  proximityBadge = { type: "ladder", dist: step, target: LADDERS[nextSq] };
                  break;
                } else if (SNAKES[nextSq]) {
                  proximityBadge = { type: "snake", dist: step, target: SNAKES[nextSq] };
                  break;
                }
              }

              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                    isTurn
                      ? "bg-slate-800/95 border-amber-400 shadow-md ring-1 ring-amber-400/40"
                      : "bg-slate-950/70 border-slate-800/90 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{rankMedals[rankIdx] ?? "🏅"}</span>
                      <div
                        className="w-2.5 h-2.5 rounded-full border border-white"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="line-clamp-1 max-w-[100px] text-white">
                        {p.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-[10px] text-slate-400">{biome.icon}</span>
                      <span className="text-amber-400 font-black">{visual} / 100</span>
                    </div>
                  </div>

                  {/* Proximity Warning / Opportunity Badge */}
                  {proximityBadge && (
                    <div className="mt-1 flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-normal">
                      {proximityBadge.type === "ladder" ? (
                        <span className="text-emerald-400 font-bold">
                          🪜 سلم واعد بعد {proximityBadge.dist} خطوات!
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          ⚠️ ثعبان محدق بعد {proximityBadge.dist} خطوات!
                        </span>
                      )}
                      <span className="text-slate-400 font-mono">نحو #{proximityBadge.target}</span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
      </div>
    </WoodTabletopEnvironment>
  );
}
