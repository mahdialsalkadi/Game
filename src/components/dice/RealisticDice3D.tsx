"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface RealisticDice3DProps {
  dice1?: number;
  dice2?: number;
  isRolling?: boolean;
  size?: "sm" | "md" | "lg";
  showTray?: boolean;
  className?: string;
}

// 3D Rotation coordinates for each face (1-6) of a 3D cube
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },       // Front
  2: { x: 0, y: 180 },     // Back
  3: { x: 0, y: -90 },     // Right
  4: { x: 0, y: 90 },      // Left
  5: { x: -90, y: 0 },     // Top
  6: { x: 90, y: 0 }       // Bottom
};

export default function RealisticDice3D({
  dice1 = 1,
  dice2,
  isRolling = false,
  size = "md",
  showTray = true,
  className = ""
}: RealisticDice3DProps) {
  const [internalDice1, setInternalDice1] = useState(dice1);
  const [internalDice2, setInternalDice2] = useState(dice2 ?? dice1);
  const [tumbleSeed, setTumbleSeed] = useState(0);

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setInternalDice1(Math.floor(Math.random() * 6) + 1);
        setInternalDice2(Math.floor(Math.random() * 6) + 1);
        setTumbleSeed((s) => s + 1);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setInternalDice1(dice1 || 1);
      if (dice2 !== undefined) {
        setInternalDice2(dice2);
      }
    }
  }, [isRolling, dice1, dice2]);

  const hasTwoDice = dice2 !== undefined || isRolling;
  const sum = (dice1 || 1) + (dice2 !== undefined ? dice2 : (hasTwoDice ? 1 : 0));
  const isDoubles = hasTwoDice && !isRolling && dice1 !== undefined && dice2 !== undefined && dice1 === dice2;

  // Size configurations (cube pixel sizes)
  const sizeMap = {
    sm: { cubeSize: 44, pipSize: "w-2 h-2", trayPadding: "p-3" },
    md: { cubeSize: 64, pipSize: "w-3 h-3", trayPadding: "p-4" },
    lg: { cubeSize: 84, pipSize: "w-3.5 h-3.5", trayPadding: "p-6" }
  };
  const { cubeSize, pipSize, trayPadding } = sizeMap[size];
  const halfSize = cubeSize / 2;

  const renderPips = (value: number) => {
    switch (value) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className={`${pipSize} bg-rose-600 rounded-full shadow-inner ring-1 ring-rose-800`} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex flex-col justify-between p-2">
            <span className={`${pipSize} bg-slate-900 rounded-full self-start shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full self-end shadow-inner`} />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex flex-col justify-between p-2">
            <span className={`${pipSize} bg-slate-900 rounded-full self-start shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full self-center shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full self-end shadow-inner`} />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-2 place-items-center">
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full relative p-2">
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 place-items-center">
              <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
              <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
              <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
              <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            </div>
            <span className={`${pipSize} bg-slate-900 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner`} />
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 p-2 place-items-center">
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
            <span className={`${pipSize} bg-slate-900 rounded-full shadow-inner`} />
          </div>
        );
      default:
        return null;
    }
  };

  const renderCube = (value: number, index: number) => {
    const rot = FACE_ROTATIONS[value] || FACE_ROTATIONS[1];
    const tumbleRotX = isRolling ? (tumbleSeed * 240 + index * 90) % 720 : rot.x;
    const tumbleRotY = isRolling ? (tumbleSeed * 360 + index * 120) % 720 : rot.y;

    return (
      <div
        key={index}
        style={{
          width: cubeSize,
          height: cubeSize,
          perspective: 800
        }}
        className="relative select-none"
      >
        <motion.div
          animate={{
            rotateX: tumbleRotX,
            rotateY: tumbleRotY,
            scale: isRolling ? [0.95, 1.1, 0.95] : 1,
            y: isRolling ? [-8, 4, -8] : 0
          }}
          transition={
            isRolling
              ? { duration: 0.15, ease: "linear", repeat: Infinity }
              : { type: "spring", stiffness: 260, damping: 20 }
          }
          style={{
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d"
          }}
          className="relative drop-shadow-[0_12px_18px_rgba(0,0,0,0.6)]"
        >
          {/* Face 1: Front */}
          <div
            style={{
              transform: `translateZ(${halfSize}px)`,
              width: cubeSize,
              height: cubeSize
            }}
            className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-slate-200 border border-slate-300 rounded-xl flex items-center justify-center backface-hidden shadow-inner"
          >
            {renderPips(1)}
          </div>

          {/* Face 2: Back */}
          <div
            style={{
              transform: `rotateY(180deg) translateZ(${halfSize}px)`,
              width: cubeSize,
              height: cubeSize
            }}
            className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-slate-200 border border-slate-300 rounded-xl flex items-center justify-center backface-hidden shadow-inner"
          >
            {renderPips(2)}
          </div>

          {/* Face 3: Right */}
          <div
            style={{
              transform: `rotateY(90deg) translateZ(${halfSize}px)`,
              width: cubeSize,
              height: cubeSize
            }}
            className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-slate-200 border border-slate-300 rounded-xl flex items-center justify-center backface-hidden shadow-inner"
          >
            {renderPips(3)}
          </div>

          {/* Face 4: Left */}
          <div
            style={{
              transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
              width: cubeSize,
              height: cubeSize
            }}
            className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-slate-200 border border-slate-300 rounded-xl flex items-center justify-center backface-hidden shadow-inner"
          >
            {renderPips(4)}
          </div>

          {/* Face 5: Top */}
          <div
            style={{
              transform: `rotateX(90deg) translateZ(${halfSize}px)`,
              width: cubeSize,
              height: cubeSize
            }}
            className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-slate-200 border border-slate-300 rounded-xl flex items-center justify-center backface-hidden shadow-inner"
          >
            {renderPips(5)}
          </div>

          {/* Face 6: Bottom */}
          <div
            style={{
              transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
              width: cubeSize,
              height: cubeSize
            }}
            className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-slate-200 border border-slate-300 rounded-xl flex items-center justify-center backface-hidden shadow-inner"
          >
            {renderPips(6)}
          </div>
        </motion.div>
      </div>
    );
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Dice Cubes Row */}
      <div className="flex items-center justify-center gap-6 py-2">
        {renderCube(isRolling ? internalDice1 : (dice1 || 1), 0)}
        {hasTwoDice && renderCube(isRolling ? internalDice2 : (dice2 ?? internalDice2), 1)}
      </div>

      {/* Outcome / Status Badge */}
      <div className="flex items-center gap-2">
        {isRolling ? (
          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            النرد يتدحرج الآن...
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-slate-100 font-black text-sm shadow-md">
              <span className="text-amber-400">المجموع:</span>
              <span className="text-lg text-white font-black">{sum}</span>
            </div>
            {isDoubles && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center gap-1 shadow-lg shadow-amber-500/30 glow-amber"
              >
                <Sparkles className="w-3.5 h-3.5" />
                متطابقان (Doubles)! 🎲🎲
              </motion.span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!showTray) return content;

  return (
    <div className="relative group">
      {/* Luxurious Mahogany & Felt Dice Tray */}
      <div
        className={`relative rounded-3xl ${trayPadding} bg-gradient-to-b from-[#1b4332] via-[#081c15] to-[#1b4332] border-[5px] border-[#582f0e] shadow-[0_20px_40px_rgba(0,0,0,0.85),inset_0_4px_12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center justify-center`}
      >
        {/* Brass corner brackets */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400/80 rounded-tl" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-400/80 rounded-tr" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-400/80 rounded-bl" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400/80 rounded-br" />

        {/* Felt Texture Ring Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,106,79,0.35)_0%,transparent_75%)] pointer-events-none" />

        {content}
      </div>
    </div>
  );
}
