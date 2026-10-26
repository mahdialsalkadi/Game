import React from "react";

/**
 * MedievalKingdomScene.tsx
 * Authentic 3D Medieval Realm & Fortress Castle Diorama (عصر الفرسان والتنانين ⚔️)
 * Features:
 * - Jagged mountain peaks with pine forest ridge and mist
 * - Grand stone fortress castle with twin circular gatehouse towers & conical roofs
 * - Central royal keep with crenellated battlements & fluttering royal banners
 * - Stone arch moat bridge & heavy timber drawbridge
 * - Soaring mythical dragon silhouette in the amber sunset sky
 * - Medieval gilded title plaque
 */
export default function MedievalKingdomScene() {
  return (
    <g id="medievalKingdomScene">
      <defs>
        <linearGradient id="medievalSunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="35%" stopColor="#78350f" />
          <stop offset="70%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <linearGradient id="castleStone" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id="slateRoof" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="moatWater" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="50%" stopColor="#115e59" />
          <stop offset="100%" stopColor="#042f2e" />
        </linearGradient>

        <filter id="torchGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ------------------------------------------------------------- */}
      {/* 1. MOUNTAIN PEAKS & FOREST RIDGE                              */}
      {/* ------------------------------------------------------------- */}
      {/* Distant Mountain Silhouettes */}
      <polygon points="40,240 180,110 320,240" fill="#292524" opacity="0.6" />
      <polygon points="260,240 440,80 620,240" fill="#1c1917" opacity="0.8" />
      <polygon points="560,240 780,95 1000,240" fill="#292524" opacity="0.6" />
      <polygon points="880,240 1060,120 1180,240" fill="#1c1917" opacity="0.8" />

      {/* Snowcaps on high peaks */}
      <polygon points="440,80 410,120 470,120" fill="#f8fafc" opacity="0.85" />
      <polygon points="780,95 755,130 805,130" fill="#f8fafc" opacity="0.85" />

      {/* Terrain Base & Moat */}
      <polygon points="20,240 1180,240 1180,740 20,740" fill="#1c1917" />
      <polygon points="40,420 1160,420 1160,540 40,540" fill="url(#moatWater)" />

      {/* ------------------------------------------------------------- */}
      {/* 2. GRAND STONE FORTRESS CITADEL CASTLE                        */}
      {/* ------------------------------------------------------------- */}
      <g id="citadelCastle" transform="translate(600, 220)">
        {/* Castle Curtain Wall */}
        <rect x="-180" y="80" width="360" height="150" fill="url(#castleStone)" stroke="#1e293b" strokeWidth="2" />

        {/* Wall Crenellations */}
        {Array.from({ length: 15 }).map((_, i) => (
          <rect key={`cren_${i}`} x={-175 + i * 24} y="65" width="14" height="18" fill="#475569" stroke="#1e293b" strokeWidth="1" />
        ))}

        {/* Central Royal Keep Tower */}
        <rect x="-70" y="0" width="140" height="150" fill="url(#castleStone)" stroke="#1e293b" strokeWidth="2" />
        {/* Keep Crenellations */}
        {[-65, -35, -5, 25, 55].map((xPos, idx) => (
          <rect key={`keep_cren_${idx}`} x={xPos} y="-15" width="16" height="18" fill="#475569" stroke="#1e293b" strokeWidth="1" />
        ))}

        {/* Royal Crest Pennant Flag */}
        <line x1="0" y1="-15" x2="0" y2="-55" stroke="#f59e0b" strokeWidth="2.5" />
        <polygon points="0,-55 45,-42 0,-30" fill="#dc2626" stroke="#f59e0b" strokeWidth="1" />
        <circle cx="16" cy="-42" r="4" fill="#fef08a" />

        {/* Twin Circular Gatehouse Towers */}
        {/* Left Gatehouse Tower */}
        <g transform="translate(-140, 20)">
          <rect x="-35" y="0" width="70" height="210" rx="4" fill="url(#castleStone)" stroke="#1e293b" strokeWidth="2" />
          {/* Conical Slate Roof */}
          <polygon points="-42,0 0,-70 42,0" fill="url(#slateRoof)" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="0" y1="-70" x2="0" y2="-85" stroke="#f59e0b" strokeWidth="1.5" />
          <polygon points="0,-85 20,-78 0,-72" fill="#2563eb" />
          {/* Arrow Slits */}
          <rect x="-3" y="40" width="6" height="25" fill="#0f172a" />
          <rect x="-3" y="90" width="6" height="25" fill="#0f172a" />
        </g>

        {/* Right Gatehouse Tower */}
        <g transform="translate(140, 20)">
          <rect x="-35" y="0" width="70" height="210" rx="4" fill="url(#castleStone)" stroke="#1e293b" strokeWidth="2" />
          <polygon points="-42,0 0,-70 42,0" fill="url(#slateRoof)" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="0" y1="-70" x2="0" y2="-85" stroke="#f59e0b" strokeWidth="1.5" />
          <polygon points="0,-85 20,-78 0,-72" fill="#2563eb" />
          <rect x="-3" y="40" width="6" height="25" fill="#0f172a" />
          <rect x="-3" y="90" width="6" height="25" fill="#0f172a" />
        </g>

        {/* Castle Arched Gate & Raised Timber Drawbridge */}
        <path d="M -35 230 L -35 150 A 35 35 0 0 1 35 150 L 35 230 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
        {/* Iron Portcullis Grate */}
        <g stroke="#64748b" strokeWidth="2">
          <line x1="-25" y1="150" x2="-25" y2="230" />
          <line x1="-10" y1="130" x2="-10" y2="230" />
          <line x1="10" y1="130" x2="10" y2="230" />
          <line x1="25" y1="150" x2="25" y2="230" />
          <line x1="-35" y1="170" x2="35" y2="170" />
          <line x1="-35" y1="195" x2="35" y2="195" />
        </g>

        {/* Flaming Wall Torches */}
        {[-90, 90].map((tX, tIdx) => (
          <g key={`torch_${tIdx}`} transform={`translate(${tX}, 130)`}>
            <rect x="-2" y="0" width="4" height="15" fill="#78350f" />
            <polygon points="-6,0 6,0 0,-14" fill="#f59e0b" filter="url(#torchGlow)" />
            <polygon points="-3,-2 3,-2 0,-11" fill="#fef08a" />
          </g>
        ))}
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 3. SOARING MYTHICAL DRAGON SILHOUETTE                         */}
      {/* ------------------------------------------------------------- */}
      <g id="flyingDragon" transform="translate(320, 100) scale(0.9)">
        {/* Dragon Body & Serpentine Tail */}
        <path
          d="M 0 0 Q 30 -15 65 0 Q 95 10 130 0 Q 170 -10 200 20 Q 160 15 125 15 Q 80 25 45 15 Z"
          fill="#0f172a"
        />
        {/* Dragon Horned Head */}
        <polygon points="-5,-4 15,-12 8,-2" fill="#0f172a" />
        <polygon points="-8,-6 5,-18 3,-4" fill="#0f172a" />
        {/* Glowing Dragon Eye */}
        <circle cx="2" cy="-4" r="1.5" fill="#f59e0b" filter="url(#torchGlow)" />

        {/* Dragon Broad Wingspan (Left & Right) */}
        {/* Upper Wing */}
        <path
          d="M 45 5 Q 70 -75 140 -85 Q 110 -40 120 0 Q 90 -20 70 5 Z"
          fill="#1c1917"
          stroke="#451a03"
          strokeWidth="1.2"
        />
        {/* Lower Wing */}
        <path
          d="M 60 10 Q 95 -45 155 -50 Q 130 -15 135 15 Z"
          fill="#0f172a"
          opacity="0.8"
        />

        {/* Fiery Breath Flame */}
        <path
          d="M -10 -2 Q -35 -8 -60 5 Q -35 2 -10 2 Z"
          fill="#f59e0b"
          filter="url(#torchGlow)"
        />
        <path
          d="M -10 -1 Q -25 -5 -40 2 Q -25 1 -10 1 Z"
          fill="#fef08a"
        />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 4. MEDIEVAL ARCHITECTURAL TITLE PLAQUE                        */}
      {/* ------------------------------------------------------------- */}
      <g transform="translate(600, 715)">
        <rect
          x="-190"
          y="-13"
          width="380"
          height="26"
          rx="13"
          fill="#1c1917"
          stroke="#f59e0b"
          strokeWidth="1.6"
          filter="url(#torchGlow)"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="11"
          fontWeight="900"
          letterSpacing="1"
        >
          عصر الفرسان والتنانين • ملاحم القلاع الملكية ⚔️
        </text>
      </g>
    </g>
  );
}
