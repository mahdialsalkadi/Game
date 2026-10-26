"use client";

import React from "react";
import { motion } from "framer-motion";
import { getPlayerInitial } from "@/utils/playerDisplay";

export type MonopolyTokenType = "CAR" | "FALCON" | "DALLAH" | "PALM" | "HORSE" | "MABKHARA";

export const TOKEN_TYPES: MonopolyTokenType[] = [
  "CAR",
  "FALCON",
  "DALLAH",
  "PALM",
  "HORSE",
  "MABKHARA"
];

export const TOKEN_NAMES_AR: Record<MonopolyTokenType, string> = {
  CAR: "السيارة الفارهة",
  FALCON: "صقر الجزيرة",
  DALLAH: "الدلة التراثية",
  PALM: "النخلة الملكية",
  HORSE: "الخيل العربي",
  MABKHARA: "المبخرة الملكية"
};

interface MonopolyPawn3DProps {
  tokenType?: MonopolyTokenType;
  tokenIndex?: number;
  playerColor: string;
  playerName: string;
  isJailed?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function MonopolyPawn3D({
  tokenType,
  tokenIndex = 0,
  playerColor,
  playerName,
  isJailed = false,
  size = "md"
}: MonopolyPawn3DProps) {
  const chosenType: MonopolyTokenType =
    tokenType || TOKEN_TYPES[tokenIndex % TOKEN_TYPES.length];

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }[size];

  const initialLetter = getPlayerInitial(playerName || "P");

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      className={`relative ${sizeClasses} flex items-center justify-center cursor-pointer group`}
      title={`${playerName} (${TOKEN_NAMES_AR[chosenType]})`}
    >
      {/* 3D Cast Shadow on Asphalt */}
      <div className="absolute -bottom-1 w-[85%] h-1.5 bg-black/60 rounded-full blur-[1.5px] scale-x-110" />

      {/* Outer 3D Pedestal Ring with Player Color */}
      <div
        style={{
          boxShadow: `0 3px 8px rgba(0,0,0,0.8), 0 0 10px ${playerColor}88, inset 0 1px 2px rgba(255,255,255,0.7)`
        }}
        className={`w-full h-full rounded-full p-[1.5px] bg-gradient-to-b from-amber-300 via-amber-600 to-amber-950 flex items-center justify-center relative transition-transform duration-200 group-hover:scale-110 ${
          isJailed ? "ring-2 ring-rose-500 animate-pulse" : ""
        }`}
      >
        {/* Inner Player Color Bed */}
        <div
          style={{ backgroundColor: playerColor }}
          className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden shadow-inner border border-black/30"
        >
          {/* Metallic Specular Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent rounded-t-full pointer-events-none" />

          {/* 3D Gilded Miniature Token Silhouette */}
          <div className="relative z-10 w-[78%] h-[78%] flex items-center justify-center text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {chosenType === "CAR" && (
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradCar" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#78350F" />
                  </linearGradient>
                </defs>
                {/* Sports Car Silhouette */}
                <path
                  d="M3 14L5 9C5.5 7.5 7 6.5 9 6.5H15C17 6.5 18.5 7.5 19 9L21 14C21.5 15.5 20.5 17 19 17H5C3.5 17 2.5 15.5 3 14Z"
                  fill="url(#goldGradCar)"
                  stroke="#451A03"
                  strokeWidth="0.8"
                />
                {/* Windshield */}
                <path
                  d="M6.5 10.5L7.8 8.2C8.2 7.5 9 7.2 9.8 7.2H14.2C15 7.2 15.8 7.5 16.2 8.2L17.5 10.5H6.5Z"
                  fill="#1E293B"
                  opacity="0.85"
                />
                {/* Wheels */}
                <circle cx="6.5" cy="16.5" r="2.2" fill="#0F172A" stroke="#FDE68A" strokeWidth="0.7" />
                <circle cx="17.5" cy="16.5" r="2.2" fill="#0F172A" stroke="#FDE68A" strokeWidth="0.7" />
                <circle cx="6.5" cy="16.5" r="0.8" fill="#F59E0B" />
                <circle cx="17.5" cy="16.5" r="0.8" fill="#F59E0B" />
              </svg>
            )}

            {chosenType === "FALCON" && (
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradFalcon" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#713F12" />
                  </linearGradient>
                </defs>
                {/* Falcon / Eagle Silhouette */}
                <path
                  d="M12 2C13.5 2 15 3.2 15.5 4.8C16.8 4.2 18.5 4.5 19.5 5.5C21 7 21 9.5 19.5 11.5L16.5 15C15.5 17 14 19 13.5 21H10.5C10 19 8.5 17 7.5 15L4.5 11.5C3 9.5 3 7 4.5 5.5C5.5 4.5 7.2 4.2 8.5 4.8C9 3.2 10.5 2 12 2Z"
                  fill="url(#goldGradFalcon)"
                  stroke="#451A03"
                  strokeWidth="0.8"
                />
                {/* Wings Feathers */}
                <path d="M7 8L10 12M17 8L14 12" stroke="#FFFBEB" strokeWidth="0.8" strokeLinecap="round" />
                {/* Eye & Beak */}
                <circle cx="12" cy="5" r="0.8" fill="#451A03" />
                <path d="M12 5.5L13.2 6.8L12 7.2" fill="#FEF08A" />
              </svg>
            )}

            {chosenType === "DALLAH" && (
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradDallah" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="45%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#78350F" />
                  </linearGradient>
                </defs>
                {/* Dallah Finial / Lid */}
                <path d="M12 2L12.8 4.5H11.2L12 2Z" fill="#FEF08A" />
                <path d="M10 4.5H14L13.5 7H10.5L10 4.5Z" fill="url(#goldGradDallah)" />
                {/* Body */}
                <path
                  d="M10.5 7L9.5 11C9.2 12.5 10 14 11 15L9.5 20.5H14.5L13 15C14 14 14.8 12.5 14.5 11L13.5 7H10.5Z"
                  fill="url(#goldGradDallah)"
                  stroke="#451A03"
                  strokeWidth="0.7"
                />
                {/* Curved Spout */}
                <path
                  d="M14 10C16.5 10 18.5 8 19 6C18.5 8 16.5 12 13.5 13"
                  stroke="url(#goldGradDallah)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                {/* Handle */}
                <path
                  d="M10 8.5C7.5 9 6.5 11.5 7 14C7.5 16 9 17.5 10.5 17.5"
                  stroke="url(#goldGradDallah)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {chosenType === "PALM" && (
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradPalm" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#EAB308" />
                    <stop offset="100%" stopColor="#78350F" />
                  </linearGradient>
                </defs>
                {/* Palm Trunk */}
                <path
                  d="M11 21L11.5 11H12.5L13 21H11Z"
                  fill="url(#goldGradPalm)"
                  stroke="#451A03"
                  strokeWidth="0.6"
                />
                {/* Trunk rings */}
                <line x1="11.2" y1="13" x2="12.8" y2="13" stroke="#78350F" strokeWidth="0.6" />
                <line x1="11.2" y1="16" x2="12.8" y2="16" stroke="#78350F" strokeWidth="0.6" />
                <line x1="11.1" y1="19" x2="12.9" y2="19" stroke="#78350F" strokeWidth="0.6" />
                {/* Fronds */}
                <path
                  d="M12 11C9 8 5 9 3 11C6 11 9 12 12 11Z"
                  fill="url(#goldGradPalm)"
                  stroke="#451A03"
                  strokeWidth="0.5"
                />
                <path
                  d="M12 11C15 8 19 9 21 11C18 11 15 12 12 11Z"
                  fill="url(#goldGradPalm)"
                  stroke="#451A03"
                  strokeWidth="0.5"
                />
                <path
                  d="M12 11C10 6 7 5 5 6C7 8 10 9.5 12 11Z"
                  fill="url(#goldGradPalm)"
                  stroke="#451A03"
                  strokeWidth="0.5"
                />
                <path
                  d="M12 11C14 6 17 5 19 6C17 8 14 9.5 12 11Z"
                  fill="url(#goldGradPalm)"
                  stroke="#451A03"
                  strokeWidth="0.5"
                />
                <path
                  d="M12 11C12 5 10.5 3 12 2C13.5 3 12 5 12 11Z"
                  fill="url(#goldGradPalm)"
                  stroke="#451A03"
                  strokeWidth="0.5"
                />
              </svg>
            )}

            {chosenType === "HORSE" && (
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradHorse" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#78350F" />
                  </linearGradient>
                </defs>
                {/* Arabian Stallion Head / Bust */}
                <path
                  d="M7 20C7 17 8 14 9 12C8 10.5 7.5 9 8 7.5L10 4L11.5 5.5C12.5 4 14.5 4.5 15.5 5C16.5 5.5 18 6.5 18.5 8C19 9.5 18.2 11 17 11.8L16.5 13.5C18 15 18.5 18 18 20H7Z"
                  fill="url(#goldGradHorse)"
                  stroke="#451A03"
                  strokeWidth="0.7"
                />
                {/* Mane highlights */}
                <path
                  d="M10 6L9 9M11 7L10 11M12 8L11 13"
                  stroke="#FFFBEB"
                  strokeWidth="0.7"
                  strokeLinecap="round"
                />
                {/* Eye */}
                <circle cx="15.5" cy="7.5" r="0.7" fill="#451A03" />
              </svg>
            )}

            {chosenType === "MABKHARA" && (
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGradMabkhara" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="50%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#713F12" />
                  </linearGradient>
                </defs>
                {/* Mabkhara Incense Swirls */}
                <path
                  d="M10 4C10 2.5 11 2 11 1M14 4C14 2.5 13 2 13 1"
                  stroke="#FDE68A"
                  strokeWidth="0.7"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                {/* Top Bowl */}
                <path
                  d="M5 6H19L16 11H8L5 6Z"
                  fill="url(#goldGradMabkhara)"
                  stroke="#451A03"
                  strokeWidth="0.7"
                />
                {/* Mid Pillar */}
                <path
                  d="M9.5 11H14.5L13.5 16H10.5L9.5 11Z"
                  fill="url(#goldGradMabkhara)"
                  stroke="#451A03"
                  strokeWidth="0.7"
                />
                {/* Base */}
                <path
                  d="M7 16H17L18.5 21H5.5L7 16Z"
                  fill="url(#goldGradMabkhara)"
                  stroke="#451A03"
                  strokeWidth="0.7"
                />
              </svg>
            )}
          </div>

          {/* Player initial miniature badge at the bottom corner */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-slate-950/90 rounded-full border border-amber-300 text-[6.5px] font-black text-amber-200 flex items-center justify-center shadow">
            {initialLetter}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
