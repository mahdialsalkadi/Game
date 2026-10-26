import React from "react";

/**
 * CyberpunkCityScene.tsx
 * Authentic 3D Cyberpunk Neon Metropolis Diorama (سايبربانك 2088 نيون ⚡)
 * Features:
 * - Glowing perspective neon grid in cyan & magenta
 * - High-tech megacorp skyscrapers with neon vertical window slits & antenna arrays
 * - Giant floating holographic neon billboards & ads
 * - Flying spinner hover-cars with neon light trails
 * - Elevated magnetic levitation (Mag-Lev) hyper-speed train
 * - Cyberpunk neon plaque
 */
export default function CyberpunkCityScene() {
  return (
    <g id="cyberpunkCityScene">
      <defs>
        <linearGradient id="cyberSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2e0854" />
          <stop offset="40%" stopColor="#1e1035" />
          <stop offset="75%" stopColor="#090918" />
          <stop offset="100%" stopColor="#030014" />
        </linearGradient>

        <linearGradient id="cyberGridFloor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#090918" />
          <stop offset="50%" stopColor="#0f051d" />
          <stop offset="100%" stopColor="#030014" />
        </linearGradient>

        <linearGradient id="megacorpGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="neonCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>

        <linearGradient id="neonMagentaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>

        <filter id="neonGlowCyan" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="neonGlowMagenta" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ------------------------------------------------------------- */}
      {/* 1. PERSPECTIVE NEON GRID HORIZON & DISTANT NEON HAZE          */}
      {/* ------------------------------------------------------------- */}
      <polygon points="20,210 1180,210 1180,740 20,740" fill="url(#cyberGridFloor)" />

      {/* Cyber Grid Horizon Lines */}
      <g stroke="#06b6d4" strokeWidth="1" opacity="0.45">
        <line x1="20" y1="210" x2="1180" y2="210" stroke="#d946ef" strokeWidth="1.8" filter="url(#neonGlowMagenta)" />
        <line x1="20" y1="240" x2="1180" y2="240" />
        <line x1="20" y1="280" x2="1180" y2="280" />
        <line x1="20" y1="330" x2="1180" y2="330" />
        <line x1="20" y1="390" x2="1180" y2="390" />
        <line x1="20" y1="460" x2="1180" y2="460" />
        <line x1="20" y1="540" x2="1180" y2="540" />
        <line x1="20" y1="630" x2="1180" y2="630" />
        <line x1="20" y1="730" x2="1180" y2="730" stroke="#06b6d4" strokeWidth="2" filter="url(#neonGlowCyan)" />
      </g>

      {/* Perspective Radiating Laser Grid Lines */}
      <g stroke="#d946ef" strokeWidth="1.2" opacity="0.35">
        {Array.from({ length: 25 }).map((_, i) => {
          const xBottom = 40 + i * 46;
          return <line key={`grid_${i}`} x1="600" y1="180" x2={xBottom} y2="740" />;
        })}
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 2. MEGACORP MONOLITH SKYSCRAPERS & NEON TOWERS                */}
      {/* ------------------------------------------------------------- */}
      {/* Left Megatower 1 */}
      <g transform="translate(180, 110)">
        <polygon points="-50,280 50,280 35,40 -35,40" fill="url(#megacorpGlass)" stroke="#06b6d4" strokeWidth="1.5" />
        {/* Glowing Vertical Light Strips */}
        <line x1="-25" y1="50" x2="-25" y2="280" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8" />
        <line x1="0" y1="45" x2="0" y2="280" stroke="#d946ef" strokeWidth="2" opacity="0.9" filter="url(#neonGlowMagenta)" />
        <line x1="25" y1="50" x2="25" y2="280" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8" />
        {/* Antenna Spire */}
        <line x1="0" y1="40" x2="0" y2="10" stroke="#06b6d4" strokeWidth="2" />
        <circle cx="0" cy="10" r="3" fill="#ec4899" filter="url(#neonGlowMagenta)" />
      </g>

      {/* Center Giant AI Corporate Spire */}
      <g transform="translate(600, 70)">
        <polygon points="-70,320 70,320 40,20 -40,20" fill="#090918" stroke="#3b82f6" strokeWidth="2" />
        {/* Holographic Window Grid */}
        {[-30, -15, 0, 15, 30].map((xOffset, idx) => (
          <line
            key={`win_${idx}`}
            x1={xOffset}
            y1="35"
            x2={xOffset * 1.3}
            y2="320"
            stroke={idx % 2 === 0 ? "#06b6d4" : "#ec4899"}
            strokeWidth="1.4"
            opacity="0.85"
          />
        ))}
        {/* Holographic Glowing Crown Banner */}
        <rect x="-65" y="12" width="130" height="24" rx="4" fill="#030014" stroke="#06b6d4" strokeWidth="1.5" filter="url(#neonGlowCyan)" />
        <text x="0" y="28" fill="#67e8f9" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="2">
          CYBERDECK AI ⚡
        </text>
        {/* Spire Tower Apex */}
        <line x1="0" y1="12" x2="0" y2="-25" stroke="#ec4899" strokeWidth="2.5" />
        <circle cx="0" cy="-25" r="4" fill="#06b6d4" filter="url(#neonGlowCyan)" />
      </g>

      {/* Right Megatower 2 */}
      <g transform="translate(980, 130)">
        <polygon points="-55,260 55,260 40,50 -40,50" fill="url(#megacorpGlass)" stroke="#d946ef" strokeWidth="1.5" />
        <line x1="-20" y1="60" x2="-20" y2="260" stroke="#d946ef" strokeWidth="1.5" opacity="0.8" />
        <line x1="15" y1="60" x2="15" y2="260" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8" />
        <rect x="-45" y="80" width="90" height="20" rx="3" fill="#1e1035" stroke="#ec4899" strokeWidth="1.2" />
        <text x="0" y="94" fill="#f472b6" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">
          NEO TOKYO 2088
        </text>
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 3. ELEVATED MAG-LEV HYPER-SPEED MONORAIL                       */}
      {/* ------------------------------------------------------------- */}
      <g id="maglevTrack" transform="translate(0, 360)">
        {/* Glowing Neon Mag-Lev Guide Track */}
        <line x1="20" y1="40" x2="1180" y2="40" stroke="#06b6d4" strokeWidth="6" opacity="0.4" />
        <line x1="20" y1="40" x2="1180" y2="40" stroke="#67e8f9" strokeWidth="2.5" filter="url(#neonGlowCyan)" />
        {/* Concrete Pylon Supports */}
        {[200, 450, 750, 1000].map((pylonX, pIdx) => (
          <g key={`pylon_${pIdx}`} transform={`translate(${pylonX}, 40)`}>
            <rect x="-6" y="0" width="12" height="60" fill="#0f172a" stroke="#06b6d4" strokeWidth="0.8" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#06b6d4" strokeWidth="2" />
          </g>
        ))}

        {/* Hyper-speed Aerodynamic Cyber Train */}
        <g transform="translate(680, 22)">
          {/* Light Streamer Trail */}
          <polygon points="-80,8 0,0 0,16 -80,8" fill="url(#neonCyanGrad)" opacity="0.5" />
          {/* Train Body */}
          <rect x="0" y="2" width="95" height="15" rx="5" fill="#ffffff" stroke="#06b6d4" strokeWidth="1.5" />
          <rect x="10" y="5" width="20" height="5" rx="1" fill="#06b6d4" />
          <rect x="35" y="5" width="20" height="5" rx="1" fill="#06b6d4" />
          <rect x="60" y="5" width="20" height="5" rx="1" fill="#06b6d4" />
          {/* Neon Headlamp */}
          <circle cx="92" cy="9" r="3" fill="#67e8f9" filter="url(#neonGlowCyan)" />
        </g>
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 4. FLYING SPINNERS & HOVER-CARS                               */}
      {/* ------------------------------------------------------------- */}
      {/* Spinner 1: Flying across the sky */}
      <g transform="translate(360, 200)">
        {/* Cyan Jet Trail */}
        <line x1="-40" y1="8" x2="0" y2="8" stroke="#06b6d4" strokeWidth="3" opacity="0.7" />
        {/* Hover-car Body */}
        <rect x="0" y="0" width="30" height="14" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
        <ellipse cx="20" cy="5" rx="6" ry="3" fill="#67e8f9" opacity="0.9" />
        <circle cx="28" cy="8" r="2" fill="#ef4444" />
      </g>

      {/* Spinner 2: Flying towards horizon */}
      <g transform="translate(820, 260)">
        {/* Magenta Jet Trail */}
        <line x1="-30" y1="6" x2="0" y2="6" stroke="#ec4899" strokeWidth="2.5" opacity="0.7" />
        <rect x="0" y="0" width="24" height="11" rx="3" fill="#1e1035" stroke="#ec4899" strokeWidth="1" />
        <ellipse cx="16" cy="4" rx="4" ry="2" fill="#f472b6" opacity="0.9" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 5. CYBERPUNK ARCHITECTURAL TITLE PLAQUE                       */}
      {/* ------------------------------------------------------------- */}
      <g transform="translate(600, 715)">
        <rect
          x="-190"
          y="-13"
          width="380"
          height="26"
          rx="13"
          fill="#030014"
          stroke="#06b6d4"
          strokeWidth="1.6"
          filter="url(#neonGlowCyan)"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fill="#67e8f9"
          fontSize="11"
          fontWeight="900"
          letterSpacing="1"
        >
          سايبربانك 2088 • صراع النيون والمستقبل ⚡
        </text>
      </g>
    </g>
  );
}
