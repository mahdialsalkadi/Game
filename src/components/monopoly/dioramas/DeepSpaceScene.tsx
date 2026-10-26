import React from "react";

/**
 * DeepSpaceScene.tsx
 * Authentic 3D Deep Space & Cosmic Starbase Diorama (غزو المجرة وفضاء النجوم 🚀)
 * Features:
 * - Twinkling cosmic starfield & colorful nebula dust clouds
 * - Giant ringed gas giant planet with atmospheric glow
 * - Massive orbital Starbase Citadel with rotating habitat torus
 * - Hyperspace warp gate station with blue plasma vortex
 * - Deep space explorer cruisers and shuttle craft
 * - Cosmic gilded title plaque
 */
export default function DeepSpaceScene() {
  return (
    <g id="deepSpaceScene">
      <defs>
        <radialGradient id="nebulaPurpleGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#050b14" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="gasPlanetAtmosphere" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="35%" stopColor="#3b82f6" />
          <stop offset="70%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>

        <linearGradient id="planetRingsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="20%" stopColor="#67e8f9" stopOpacity="0.65" />
          <stop offset="50%" stopColor="#fef08a" stopOpacity="0.8" />
          <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </linearGradient>

        <filter id="spaceGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ------------------------------------------------------------- */}
      {/* 1. STARFIELD & NEBULA CLOUDS                                  */}
      {/* ------------------------------------------------------------- */}
      {/* Deep Space Starfield Void */}
      <rect x="20" y="20" width="1160" height="720" fill="#050b14" />

      {/* Swirling Nebula Dust Clouds */}
      <ellipse cx="300" cy="200" rx="250" ry="120" fill="url(#nebulaPurpleGrad)" filter="url(#spaceGlow)" />
      <ellipse cx="900" cy="350" rx="220" ry="140" fill="url(#nebulaPurpleGrad)" filter="url(#spaceGlow)" />

      {/* Twinkling Cosmic Stars */}
      <g fill="#ffffff">
        {[
          [100, 50, 1.5], [180, 80, 2], [240, 40, 1], [320, 120, 2.5], [420, 60, 1.2],
          [550, 90, 2], [700, 45, 1.8], [820, 110, 2.2], [960, 70, 1.5], [1050, 50, 2],
          [1120, 120, 1.2], [80, 180, 2], [220, 220, 1.4], [480, 260, 1.8], [640, 190, 2],
          [780, 250, 1.2], [950, 210, 2.5], [1100, 280, 1.5], [150, 340, 2], [280, 420, 1.2],
          [520, 380, 1.8], [720, 430, 2], [880, 390, 1.5], [1040, 460, 2.2], [60, 510, 1.4],
          [200, 580, 2], [380, 530, 1.5], [620, 600, 2.2], [840, 560, 1.8], [1020, 620, 2]
        ].map(([x, y, r], idx) => (
          <circle key={`star_${idx}`} cx={x} cy={y} r={r} opacity={0.7 + (idx % 4) * 0.1} />
        ))}
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 2. GIANT RINGED GAS PLANET                                    */}
      {/* ------------------------------------------------------------- */}
      <g id="giantGasPlanet" transform="translate(860, 180)">
        {/* Planet Sphere */}
        <circle cx="0" cy="0" r="75" fill="url(#gasPlanetAtmosphere)" filter="url(#spaceGlow)" />
        {/* Atmospheric Cloud Bands */}
        <path d="M -70 -20 Q 0 -10 70 -20" stroke="#93c5fd" strokeWidth="3" fill="none" opacity="0.4" />
        <path d="M -74 10 Q 0 25 74 10" stroke="#60a5fa" strokeWidth="4" fill="none" opacity="0.4" />
        <path d="M -65 35 Q 0 50 65 35" stroke="#3b82f6" strokeWidth="3" fill="none" opacity="0.3" />

        {/* Giant Translucent Planetary Rings */}
        <ellipse cx="0" cy="0" rx="150" ry="38" fill="none" stroke="url(#planetRingsGrad)" strokeWidth="14" transform="rotate(-18)" opacity="0.85" />
        <ellipse cx="0" cy="0" rx="162" ry="42" fill="none" stroke="#67e8f9" strokeWidth="2" transform="rotate(-18)" opacity="0.6" />

        {/* Small Orbiting Moon */}
        <circle cx="-130" cy="-60" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 3. ORBITAL STARBASE CITADEL STATION (محطة المدار الكبرى)       */}
      {/* ------------------------------------------------------------- */}
      <g id="orbitalStarbase" transform="translate(320, 240)">
        {/* Central Core Spire */}
        <rect x="-10" y="-80" width="20" height="160" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
        {/* Communication Dishes */}
        <circle cx="0" cy="-80" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="0" cy="-80" r="4" fill="#fef08a" />
        <line x1="0" y1="-80" x2="0" y2="-105" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="0" cy="-105" r="3" fill="#ef4444" filter="url(#spaceGlow)" />

        {/* Rotating Habitat Torus Ring */}
        <ellipse cx="0" cy="0" rx="90" ry="24" fill="none" stroke="#0ea5e9" strokeWidth="12" opacity="0.9" />
        <ellipse cx="0" cy="0" rx="90" ry="24" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="14 10" />

        {/* Torus Structural Spokes */}
        <line x1="-90" y1="0" x2="90" y2="0" stroke="#64748b" strokeWidth="3" />
        <line x1="0" y1="-24" x2="0" y2="24" stroke="#64748b" strokeWidth="3" />

        {/* Solar Panel Arrays (Left & Right) */}
        <g transform="translate(-115, -15)">
          <rect x="-40" y="-15" width="40" height="30" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="-20" y1="-15" x2="-20" y2="15" stroke="#38bdf8" strokeWidth="1" />
          <line x1="-40" y1="0" x2="0" y2="0" stroke="#38bdf8" strokeWidth="1" />
        </g>
        <g transform="translate(115, -15)">
          <rect x="0" y="-15" width="40" height="30" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="20" y1="-15" x2="20" y2="15" stroke="#38bdf8" strokeWidth="1" />
          <line x1="0" y1="0" x2="40" y2="0" stroke="#38bdf8" strokeWidth="1" />
        </g>
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 4. HYPERSPACE WARP GATE (بوابة القفز الكوني)                   */}
      {/* ------------------------------------------------------------- */}
      <g id="warpGate" transform="translate(620, 460)">
        {/* Hexagonal Warp Conduit Frame */}
        <polygon points="-55,-35 0,-65 55,-35 55,35 0,65 -55,35" fill="none" stroke="#38bdf8" strokeWidth="5" opacity="0.9" />
        <polygon points="-50,-32 0,-58 50,-32 50,32 0,58 -50,32" fill="#030014" />
        {/* Plasma Energy Vortex */}
        <circle cx="0" cy="0" r="38" fill="#0284c7" opacity="0.6" filter="url(#spaceGlow)" />
        <circle cx="0" cy="0" r="22" fill="#38bdf8" opacity="0.8" />
        <circle cx="0" cy="0" r="10" fill="#ffffff" filter="url(#spaceGlow)" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 5. EXPLORER STARSHIPS & CRUISERS                              */}
      {/* ------------------------------------------------------------- */}
      {/* Flagship Cruiser 1 */}
      <g transform="translate(740, 360)">
        {/* Plasma Thruster Flame */}
        <polygon points="-45,0 -20,-6 -20,6" fill="#38bdf8" filter="url(#spaceGlow)" />
        <polygon points="-35,0 -20,-3 -20,3" fill="#ffffff" />
        {/* Hull */}
        <polygon points="-20,-12 35,-6 55,0 35,6 -20,12" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        <ellipse cx="25" cy="0" rx="8" ry="3" fill="#0284c7" />
        {/* Wings */}
        <polygon points="0,-10 15,-22 -10,-14" fill="#3b82f6" />
        <polygon points="0,10 15,22 -10,14" fill="#3b82f6" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 6. COSMIC ARCHITECTURAL PLAQUE                                */}
      {/* ------------------------------------------------------------- */}
      <g transform="translate(600, 715)">
        <rect
          x="-190"
          y="-13"
          width="380"
          height="26"
          rx="13"
          fill="#050b14"
          stroke="#38bdf8"
          strokeWidth="1.6"
          filter="url(#spaceGlow)"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fill="#93c5fd"
          fontSize="11"
          fontWeight="900"
          letterSpacing="1"
        >
          غزو المجرة • مستكشفو الفضاء السحيق 🚀
        </text>
      </g>
    </g>
  );
}
