"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sfx } from "@/utils/soundEffects";

export interface RealisticDice3DProps {
  values?: number[];
  isRolling?: boolean;
  onRollComplete?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showTray?: boolean;
}

// 3D face rotations that bring the target face to the front facing the viewer
const FACE_ROTATIONS: Record<number, { rx: number; ry: number }> = {
  1: { rx: 0, ry: 0 },
  2: { rx: -90, ry: 0 },
  3: { rx: 0, ry: -90 },
  4: { rx: 0, ry: 90 },
  5: { rx: 90, ry: 0 },
  6: { rx: 0, ry: 180 },
};

// Standard 3x3 grid indices for pips (0 to 8)
const PIP_INDICES: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const SIZE_CONFIGS = {
  sm: {
    cubeSize: 44,
    halfSize: 22,
    pipSize: 7,
    pipMargin: 3,
    trayWidth: "w-44",
    trayHeight: "h-32",
    trayPadding: "p-2.5",
    gap: "gap-3",
  },
  md: {
    cubeSize: 60,
    halfSize: 30,
    pipSize: 10,
    pipMargin: 4,
    trayWidth: "w-60",
    trayHeight: "h-40",
    trayPadding: "p-3.5",
    gap: "gap-5",
  },
  lg: {
    cubeSize: 76,
    halfSize: 38,
    pipSize: 13,
    pipMargin: 5,
    trayWidth: "w-72",
    trayHeight: "h-48",
    trayPadding: "p-4",
    gap: "gap-7",
  },
};

interface DieProps {
  value: number;
  isRolling: boolean;
  index: number;
  size: "sm" | "md" | "lg";
}

const SingleDieCube: React.FC<DieProps> = ({ value, isRolling, index, size }) => {
  const config = SIZE_CONFIGS[size];
  const { cubeSize, halfSize, pipSize } = config;

  // Clamped value between 1 and 6
  const targetFace = Math.min(6, Math.max(1, Math.round(value || 1)));
  const baseRotation = FACE_ROTATIONS[targetFace] || FACE_ROTATIONS[1];

  // Resting micro-angles so settled dice look naturally physical on the felt
  const restingZ = index === 0 ? -4 : 6;
  const restingOffset = index === 0 ? -2 : 3;

  // Generate randomized multi-rotation tumbling keys when rolling
  const rollAnimation = useMemo(() => {
    const extraSpinsX = (index + 2) * 360;
    const extraSpinsY = (index + 3) * 360;
    const extraSpinsZ = 360 * (index % 2 === 0 ? 1 : -1);

    return {
      rotateX: [0, 180 + extraSpinsX * 0.3, 360 + extraSpinsX * 0.7, extraSpinsX + baseRotation.rx + restingOffset],
      rotateY: [0, 270 + extraSpinsY * 0.4, 540 + extraSpinsY * 0.8, extraSpinsY + baseRotation.ry],
      rotateZ: [0, extraSpinsZ * 0.5, extraSpinsZ, restingZ],
      y: [0, -40 - index * 10, -65 - index * 5, -12, 0],
      scale: [1, 1.14, 1.22, 0.96, 1],
    };
  }, [baseRotation, index, restingZ, restingOffset]);

  const settledState = {
    rotateX: baseRotation.rx + restingOffset,
    rotateY: baseRotation.ry,
    rotateZ: restingZ,
    y: 0,
    scale: 1,
  };

  // Render individual face pips inside 3x3 CSS grid
  const renderFace = (faceNumber: number, transformStyle: string) => {
    const activePips = PIP_INDICES[faceNumber] || [];
    const isAce = faceNumber === 1;

    return (
      <div
        className="absolute top-0 left-0 rounded-2xl p-1.5 flex items-center justify-center select-none backface-hidden border border-stone-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(0,0,0,0.22),inset_2px_0_3px_rgba(255,255,255,0.6),inset_-2px_0_3px_rgba(0,0,0,0.15)] bg-gradient-to-br from-white via-[#fcfbfa] to-[#e7e4dc]"
        style={{
          width: `${cubeSize}px`,
          height: `${cubeSize}px`,
          transform: transformStyle,
        }}
      >
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 place-items-center">
          {Array.from({ length: 9 }).map((_, pipIdx) => {
            const hasPip = activePips.includes(pipIdx);
            if (!hasPip) return <div key={pipIdx} className="w-full h-full" />;

            return (
              <div
                key={pipIdx}
                style={{
                  width: `${isAce ? pipSize * 1.35 : pipSize}px`,
                  height: `${isAce ? pipSize * 1.35 : pipSize}px`,
                }}
                className={`rounded-full transition-transform ${
                  isAce
                    ? "bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.65),0_1px_1px_rgba(255,255,255,0.9)]"
                    : "bg-gradient-to-br from-zinc-800 via-neutral-900 to-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.85),0_0.8px_1px_rgba(255,255,255,0.85)]"
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{
        width: `${cubeSize}px`,
        height: `${cubeSize}px`,
        perspective: 1200,
      }}
    >
      {/* Dynamic contact shadow on felt surface */}
      <motion.div
        animate={
          isRolling
            ? {
                scale: [1, 0.55, 0.45, 0.85, 1],
                opacity: [0.75, 0.25, 0.18, 0.65, 0.75],
                filter: ["blur(4px)", "blur(12px)", "blur(16px)", "blur(6px)", "blur(4px)"],
              }
            : {
                scale: 1,
                opacity: 0.75,
                filter: "blur(4px)",
              }
        }
        transition={
          isRolling
            ? { duration: 0.82 + index * 0.08, ease: [0.25, 1, 0.5, 1] }
            : { duration: 0.3 }
        }
        style={{
          width: `${cubeSize * 0.9}px`,
          height: `${cubeSize * 0.35}px`,
          bottom: `-${cubeSize * 0.18}px`,
        }}
        className="absolute rounded-full bg-black/85 pointer-events-none"
      />

      {/* 3D Rotating Die Cube */}
      <motion.div
        animate={isRolling ? rollAnimation : settledState}
        transition={
          isRolling
            ? {
                duration: 0.82 + index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }
            : {
                type: "spring",
                stiffness: 260,
                damping: 20,
              }
        }
        style={{
          width: `${cubeSize}px`,
          height: `${cubeSize}px`,
          transformStyle: "preserve-3d",
        }}
        className="relative cursor-pointer"
      >
        {/* Face 1: Front */}
        {renderFace(1, `translateZ(${halfSize}px)`)}
        {/* Face 6: Back */}
        {renderFace(6, `rotateY(180deg) translateZ(${halfSize}px)`)}
        {/* Face 2: Top */}
        {renderFace(2, `rotateX(90deg) translateZ(${halfSize}px)`)}
        {/* Face 5: Bottom */}
        {renderFace(5, `rotateX(-90deg) translateZ(${halfSize}px)`)}
        {/* Face 3: Right */}
        {renderFace(3, `rotateY(90deg) translateZ(${halfSize}px)`)}
        {/* Face 4: Left */}
        {renderFace(4, `rotateY(-90deg) translateZ(${halfSize}px)`)}
      </motion.div>
    </div>
  );
};

export const RealisticDice3D: React.FC<RealisticDice3DProps> = ({
  values = [1],
  isRolling = false,
  onRollComplete,
  size = "md",
  className = "",
  showTray = true,
}) => {
  const [internalRolling, setInternalRolling] = useState<boolean>(isRolling);
  const config = SIZE_CONFIGS[size];

  // Sync internal state and trigger onRollComplete when settling
  useEffect(() => {
    if (isRolling) {
      setInternalRolling(true);
      const safetyTimer = setTimeout(() => {
        setInternalRolling(false);
        onRollComplete?.();
      }, 3000);
      return () => clearTimeout(safetyTimer);
    } else {
      setInternalRolling(false);
      onRollComplete?.();
    }
  }, [isRolling, onRollComplete]);

  // Normalize dice values (support 1 or 2 dice)
  const displayValues = values.length > 0 ? values.slice(0, 2) : [6];

  const diceContent = (
    <div className={`flex items-center justify-center ${config.gap} z-10 relative`}>
      {displayValues.map((val, idx) => (
        <SingleDieCube
          key={idx}
          value={val}
          isRolling={internalRolling}
          index={idx}
          size={size}
        />
      ))}
    </div>
  );

  if (!showTray) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{diceContent}</div>;
  }

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center ${config.trayWidth} ${config.trayHeight} ${className}`}
    >
      {/* Elegant Wood / Leather Outer Tray Border */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#382011] via-[#221309] to-[#120803] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.18)] border-2 border-[#57351c]">
        {/* Corner Brass Rivets */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm opacity-85" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm opacity-85" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm opacity-85" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm opacity-85" />

        {/* Deep Velvet / Emerald Felt Basin */}
        <div className="w-full h-full rounded-2xl bg-gradient-to-b from-[#094831] via-[#053724] to-[#022417] shadow-[inset_0_10px_22px_rgba(0,0,0,0.92),inset_0_0_25px_rgba(0,0,0,0.6)] border border-dashed border-emerald-500/25 flex items-center justify-center relative overflow-hidden">
          {/* Subtle felt texture shine */}
          <div className="absolute inset-0 bg-radial from-emerald-400/10 via-transparent to-transparent pointer-events-none" />

          {/* Dice Content */}
          {diceContent}
        </div>
      </div>
    </div>
  );
};

export interface DiceShakerButtonProps {
  onRoll: () => void;
  isRolling?: boolean;
  diceCount?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const DiceShakerButton: React.FC<DiceShakerButtonProps> = ({
  onRoll,
  isRolling = false,
  diceCount = 1,
  disabled = false,
  className = "",
  label = "هز الكوب وارمِ النرد"
}) => {
  const [shaking, setShaking] = useState(false);

  const handleClick = () => {
    if (disabled || isRolling || shaking) return;

    // Haptic feedback pattern: rhythmic cup rattle
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([35, 20, 50, 20, 70]);
      } catch {}
    }

    // Web Audio procedural leather shaker cup rattle sound
    sfx.playDiceShake();

    setShaking(true);
    setTimeout(() => {
      sfx.playDiceTumble();
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(60);
        } catch {}
      }
      setShaking(false);
      onRoll();
    }, 380);
  };

  return (
    <motion.button
      type="button"
      disabled={disabled || isRolling}
      onClick={handleClick}
      animate={
        shaking
          ? {
              rotate: [-12, 14, -16, 12, -8, 0],
              x: [-6, 7, -8, 6, -3, 0],
              y: [-10, 5, -8, 4, 0],
              scale: [1, 1.08, 0.95, 1.05, 1]
            }
          : { scale: 1, rotate: 0 }
      }
      transition={{ duration: 0.38, ease: "easeInOut" }}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.94 }}
      className={`relative w-full max-w-xs py-4 px-6 rounded-3xl bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 active:from-amber-600 active:to-amber-800 text-slate-950 font-black shadow-[0_12px_30px_rgba(245,158,11,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] border-2 border-amber-300 flex items-center justify-between gap-3 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* 3D Shaker Cup Icon / Graphic */}
      <div className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-b from-amber-800 via-amber-950 to-stone-900 border border-amber-400/40 shadow-inner">
        <span className="text-2xl drop-shadow select-none">🎲</span>
        {diceCount > 1 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white/40 shadow">
            x{diceCount}
          </span>
        )}
      </div>

      {/* Main Action Text */}
      <div className="flex-1 text-right">
        <div className="text-base font-black tracking-wide leading-tight text-slate-950 drop-shadow-sm">
          {label}
        </div>
        <div className="text-[11px] font-bold text-amber-950/80">
          {diceCount > 1 ? "نردان في الكوب الذهبي" : "نرد واحد حقيقي"}
        </div>
      </div>

      {/* Tactile Arrow Indicator */}
      <div className="w-8 h-8 rounded-full bg-slate-950/15 flex items-center justify-center text-slate-950 text-lg font-bold">
        ⚡
      </div>
    </motion.button>
  );
};

export default RealisticDice3D;
