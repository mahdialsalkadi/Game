import React from "react";

/**
 * ClassicAtlanticCityScene.tsx
 * Authentic 1935 Atlantic City Coastal Boardwalk Diorama for Classic Monopoly (Monopoly Original 🎩)
 * Features:
 * - Atlantic Ocean with gentle waves and sea foam
 * - The iconic 1935 Wooden Boardwalk with timber planks, railings & gaslamps
 * - Historic Absecon Lighthouse with red/white masonry stripes & rotating beacon
 * - The Steel Pier with vintage 1930s Atlantic City Giant Ferris Wheel
 * - Grand Art Deco beachfront luxury hotel (Traymore / Marlborough-Blenheim style)
 * - Reading Railroad 1930s steam locomotive crossing arched brick bridge
 * - Vintage biplane with trailing "MONOPOLY 1935 🎩" banner
 */
export default function ClassicAtlanticCityScene() {
  return (
    <g id="classicAtlanticCityScene">
      <defs>
        {/* Ocean Horizon Gradients */}
        <linearGradient id="oceanSurface" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="45%" stopColor="#0284c7" />
          <stop offset="85%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="sandBeach" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Boardwalk Timber Planks Gradient */}
        <linearGradient id="boardwalkWood" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="25%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#b45309" />
          <stop offset="75%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        <linearGradient id="hotelDecoFacade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>

        <linearGradient id="lighthouseRedStripe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>

        <linearGradient id="lighthouseWhiteStripe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id="beaconBeamGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#fde047" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>

        <filter id="coastalGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ------------------------------------------------------------- */}
      {/* 1. SKYLINE, SEAGULLS & 1930s VINTAGE BIPLANE                   */}
      {/* ------------------------------------------------------------- */}
      {/* Vintage Coastal Sun */}
      <circle cx="280" cy="80" r="32" fill="#fef08a" opacity="0.6" filter="url(#coastalGlow)" />
      <circle cx="280" cy="80" r="20" fill="#ffffff" opacity="0.85" />

      {/* Flock of Coastal Seagulls */}
      <g stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75">
        <path d="M 280 60 Q 287 54 294 60 Q 301 54 308 60" />
        <path d="M 330 45 Q 336 40 342 45 Q 348 40 354 45" />
        <path d="M 310 80 Q 315 76 320 80 Q 325 76 330 80" />
        <path d="M 250 90 Q 255 86 260 90 Q 265 86 270 90" />
      </g>

      {/* 1930s Biplane Pulling Classic Monopoly Banner */}
      <g transform="translate(420, 50)">
        {/* Trailing Tow Wire */}
        <line x1="120" y1="20" x2="160" y2="24" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
        {/* Banner */}
        <path
          d="M 160 12 L 390 10 Q 405 24 390 38 L 160 36 Q 170 24 160 12 Z"
          fill="#dc2626"
          stroke="#fef08a"
          strokeWidth="1.5"
          filter="url(#coastalGlow)"
        />
        <text
          x="275"
          y="28"
          fill="#fef08a"
          fontSize="13"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="1"
        >
          MONOPOLY 1935 🎩 ORIGINAL
        </text>

        {/* Vintage Biplane Body */}
        {/* Propeller Spinner */}
        <ellipse cx="25" cy="22" rx="2" ry="14" fill="#ffffff" opacity="0.7" />
        <circle cx="27" cy="22" r="3" fill="#1e293b" />
        {/* Fuselage */}
        <path d="M 27 22 L 50 16 L 115 19 L 120 22 L 115 25 L 50 28 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
        {/* Cockpit with Pilot */}
        <ellipse cx="65" cy="19" rx="8" ry="4" fill="#1e293b" />
        <circle cx="68" cy="18" r="3" fill="#ffffff" />
        {/* Top & Bottom Biplane Wings */}
        <rect x="42" y="8" width="38" height="5" rx="2" fill="#ca8a04" stroke="#854d0e" strokeWidth="0.8" />
        <rect x="42" y="30" width="38" height="5" rx="2" fill="#ca8a04" stroke="#854d0e" strokeWidth="0.8" />
        {/* Wing Struts */}
        <line x1="50" y1="13" x2="50" y2="30" stroke="#1e293b" strokeWidth="1.2" />
        <line x1="72" y1="13" x2="72" y2="30" stroke="#1e293b" strokeWidth="1.2" />
        {/* Tail Fin */}
        <polygon points="110,19 125,8 123,22" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
        <polygon points="108,22 120,28 118,22" fill="#ca8a04" stroke="#854d0e" strokeWidth="0.8" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 2. ATLANTIC OCEAN, SURF BREAKERS & SANDY BEACH                 */}
      {/* ------------------------------------------------------------- */}
      {/* Ocean Horizon Water Body */}
      <rect x="20" y="190" width="1160" height="240" fill="url(#oceanSurface)" />

      {/* Distant Steamship on the Horizon */}
      <g transform="translate(100, 192)">
        <polygon points="0,10 45,10 40,16 5,16" fill="#1e293b" />
        <rect x="15" y="4" width="16" height="6" fill="#ffffff" />
        <rect x="20" y="-1" width="4" height="5" fill="#dc2626" />
        {/* Smokestack Puff */}
        <circle cx="28" cy="-4" r="2.5" fill="#ffffff" opacity="0.6" />
        <circle cx="34" cy="-6" r="3.5" fill="#ffffff" opacity="0.4" />
      </g>

      {/* Undulating Coastal Ocean Waves */}
      <g stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.85" strokeLinecap="round">
        <path d="M 30 230 Q 80 220 130 230 T 230 230 T 330 230 T 430 230 T 530 230 T 630 230 T 730 230 T 830 230 T 930 230 T 1030 230 T 1130 230" />
        <path d="M 60 270 Q 120 260 180 270 T 300 270 T 420 270 T 540 270 T 660 270 T 780 270 T 900 270 T 1020 270 T 1140 270" strokeWidth="3" opacity="0.75" />
        <path d="M 20 310 Q 70 300 120 310 T 220 310 T 320 310 T 420 310 T 520 310 T 620 310 T 720 310 T 820 310 T 920 310 T 1020 310 T 1120 310" strokeWidth="3.2" opacity="0.9" />
        {/* Rolling White Sea-Foam Breakers along the Shoreline */}
        <path d="M 20 350 Q 80 340 140 350 T 260 350 T 380 350 T 500 350 T 620 350 T 740 350 T 860 350 T 980 350 T 1100 350" strokeWidth="4.5" stroke="#f0f9ff" opacity="0.95" />
      </g>

      {/* Golden Sandy Atlantic Beach */}
      <polygon points="20,355 1180,355 1180,450 20,450" fill="url(#sandBeach)" />

      {/* Beach Umbrellas & Sunbathers */}
      <g transform="translate(180, 390)">
        <path d="M 0 0 A 14 14 0 0 1 28 0 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
        <path d="M 7 -12 L 14 0 L 21 -12" stroke="#ffffff" strokeWidth="1" fill="none" />
        <line x1="14" y1="0" x2="14" y2="18" stroke="#78350f" strokeWidth="1.8" />
      </g>
      <g transform="translate(250, 405)">
        <path d="M 0 0 A 14 14 0 0 1 28 0 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
        <line x1="14" y1="0" x2="14" y2="18" stroke="#78350f" strokeWidth="1.8" />
      </g>
      <g transform="translate(750, 395)">
        <path d="M 0 0 A 14 14 0 0 1 28 0 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
        <line x1="14" y1="0" x2="14" y2="18" stroke="#78350f" strokeWidth="1.8" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 3. THE HISTORIC ATLANTIC CITY WOODEN BOARDWALK                */}
      {/* ------------------------------------------------------------- */}
      {/* Boardwalk Timber Deck Foundation */}
      <polygon points="20,440 1180,440 1180,740 20,740" fill="url(#boardwalkWood)" />

      {/* Horizontal Wooden Deck Planks */}
      <g stroke="#451a03" strokeWidth="1.2" opacity="0.65">
        <line x1="20" y1="460" x2="1180" y2="460" />
        <line x1="20" y1="485" x2="1180" y2="485" />
        <line x1="20" y1="510" x2="1180" y2="510" />
        <line x1="20" y1="535" x2="1180" y2="535" />
        <line x1="20" y1="560" x2="1180" y2="560" />
        <line x1="20" y1="585" x2="1180" y2="585" />
        <line x1="20" y1="610" x2="1180" y2="610" />
        <line x1="20" y1="635" x2="1180" y2="635" />
        <line x1="20" y1="660" x2="1180" y2="660" />
        <line x1="20" y1="685" x2="1180" y2="685" />
        <line x1="20" y1="710" x2="1180" y2="710" />
        <line x1="20" y1="735" x2="1180" y2="735" />
      </g>

      {/* Herringbone Timber Deck Inset Border */}
      <rect x="25" y="445" width="1150" height="290" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="14 10" opacity="0.6" />

      {/* Wooden Boardwalk Handrails facing the Beach */}
      <g stroke="#ffffff" strokeWidth="2.5" opacity="0.9">
        <line x1="20" y1="442" x2="1180" y2="442" />
        <line x1="20" y1="448" x2="1180" y2="448" />
      </g>
      {/* Railing Vertical Posts */}
      <g stroke="#ffffff" strokeWidth="2.2" opacity="0.9">
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={i} x1={40 + i * 39} y1="438" x2={40 + i * 39} y2="452" />
        ))}
      </g>

      {/* Vintage Cast-Iron Gas Lamp Posts on Boardwalk */}
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={`lamp_${i}`} transform={`translate(${100 + i * 140}, 430)`}>
          {/* Post Base */}
          <rect x="-2" y="0" width="4" height="25" fill="#1e293b" />
          {/* Curved Bracket */}
          <path d="M 0 0 Q -5 -8 0 -14 Q 5 -8 0 0" fill="#1e293b" />
          {/* Glass Lantern */}
          <polygon points="-5,-14 5,-14 3,-24 -3,-24" fill="#fef08a" stroke="#1e293b" strokeWidth="1" />
          <circle cx="0" cy="-19" r="7" fill="#fef08a" opacity="0.6" filter="url(#coastalGlow)" />
        </g>
      ))}

      {/* ------------------------------------------------------------- */}
      {/* 4. STEEL PIER & VINTAGE ATLANTIC CITY FERRIS WHEEL            */}
      {/* ------------------------------------------------------------- */}
      {/* Steel Pier extending into the sea */}
      <g id="steelPier" transform="translate(790, 160)">
        {/* Pier Deck Platform */}
        <rect x="-70" y="60" width="140" height="150" fill="#78350f" stroke="#451a03" strokeWidth="2" />
        <rect x="-65" y="65" width="130" height="140" fill="#92400e" stroke="#fbbf24" strokeWidth="1" strokeDasharray="8 6" />

        {/* Pier Pilings submerged in water */}
        <line x1="-60" y1="210" x2="-60" y2="240" stroke="#451a03" strokeWidth="5" />
        <line x1="-20" y1="210" x2="-20" y2="240" stroke="#451a03" strokeWidth="5" />
        <line x1="20" y1="210" x2="20" y2="240" stroke="#451a03" strokeWidth="5" />
        <line x1="60" y1="210" x2="60" y2="240" stroke="#451a03" strokeWidth="5" />

        {/* Giant Ferris Wheel (العجلة الدوارة الأيقونية) */}
        <g transform="translate(0, 75)">
          {/* A-Frame Steel Support Legs */}
          <polygon points="0,0 -40,80 -30,80" fill="#1e293b" />
          <polygon points="0,0 40,80 30,80" fill="#1e293b" />
          <line x1="-25" y1="50" x2="25" y2="50" stroke="#1e293b" strokeWidth="3" />

          {/* Outer Wheel Rim */}
          <circle cx="0" cy="0" r="62" fill="none" stroke="#ef4444" strokeWidth="3.5" />
          <circle cx="0" cy="0" r="54" fill="none" stroke="#facc15" strokeWidth="1.8" />
          <circle cx="0" cy="0" r="14" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
          <circle cx="0" cy="0" r="6" fill="#fef08a" />

          {/* 12 Wheel Spokes */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x2 = Math.cos(angle) * 60;
            const y2 = Math.sin(angle) * 60;
            const cabinColors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899"];
            const col = cabinColors[i % cabinColors.length];
            return (
              <g key={`spoke_${i}`}>
                <line x1="0" y1="0" x2={x2} y2={y2} stroke="#ffffff" strokeWidth="1.4" opacity="0.85" />
                {/* Passenger Gondola Cabin */}
                <g transform={`translate(${x2}, ${y2})`}>
                  <rect x="-5" y="-3" width="10" height="9" rx="2" fill={col} stroke="#ffffff" strokeWidth="0.8" />
                  <rect x="-3" y="-1" width="6" height="4" rx="1" fill="#fef08a" opacity="0.9" />
                </g>
              </g>
            );
          })}
        </g>
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 5. HISTORIC ABSECON LIGHTHOUSE (منارة أتلانتيك سيتي التاريخية) */}
      {/* ------------------------------------------------------------- */}
      <g id="abseconLighthouse" transform="translate(260, 110)">
        {/* Stone Keeper's Cottage Base */}
        <polygon points="-40,165 40,165 48,195 -48,195" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
        <rect x="-35" y="172" width="70" height="22" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        {/* Cottage Pitched Roof */}
        <polygon points="-38,172 0,154 38,172" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />
        {/* Cottage Windows & Door */}
        <rect x="-6" y="178" width="12" height="16" rx="2" fill="#451a03" />
        <rect x="-24" y="176" width="8" height="8" rx="1" fill="#fef08a" stroke="#1e293b" strokeWidth="0.8" />
        <rect x="16" y="176" width="8" height="8" rx="1" fill="#fef08a" stroke="#1e293b" strokeWidth="0.8" />

        {/* Tapered Lighthouse Masonry Tower */}
        {/* Band 1: Red Base */}
        <polygon points="-24,154 24,154 22,125 -22,125" fill="url(#lighthouseRedStripe)" stroke="#7f1d1d" strokeWidth="0.8" />
        {/* Band 2: White Middle */}
        <polygon points="-22,125 22,125 20,95 -20,95" fill="url(#lighthouseWhiteStripe)" stroke="#94a3b8" strokeWidth="0.8" />
        {/* Band 3: Red Upper */}
        <polygon points="-20,95 20,95 18,65 -18,65" fill="url(#lighthouseRedStripe)" stroke="#7f1d1d" strokeWidth="0.8" />
        {/* Band 4: White Collar */}
        <polygon points="-18,65 18,65 16,35 -16,35" fill="url(#lighthouseWhiteStripe)" stroke="#94a3b8" strokeWidth="0.8" />

        {/* Observation Catwalk Gallery */}
        <rect x="-22" y="32" width="44" height="4" rx="1" fill="#1e293b" />
        {/* Iron Railing */}
        <line x1="-22" y1="28" x2="22" y2="28" stroke="#1e293b" strokeWidth="1.2" />
        <line x1="-20" y1="28" x2="-20" y2="32" stroke="#1e293b" strokeWidth="1" />
        <line x1="0" y1="28" x2="0" y2="32" stroke="#1e293b" strokeWidth="1" />
        <line x1="20" y1="28" x2="20" y2="32" stroke="#1e293b" strokeWidth="1" />

        {/* Glass Lantern Room */}
        <rect x="-14" y="14" width="28" height="18" rx="2" fill="#0284c7" stroke="#1e293b" strokeWidth="1.2" opacity="0.85" />
        {/* Glowing Fresnel Lens Core */}
        <circle cx="0" cy="23" r="7" fill="#fef08a" filter="url(#coastalGlow)" />
        {/* Lighthouse Dome Cap & Spire */}
        <path d="M -16 14 Q 0 -4 16 14 Z" fill="#1e293b" />
        <line x1="0" y1="-4" x2="0" y2="-14" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="-14" r="2.5" fill="#f59e0b" />

        {/* Radiant Lighthouse Rotating Beacon Beam across the Ocean */}
        <polygon points="0,23 320,-40 320,120" fill="url(#beaconBeamGrad)" opacity="0.75" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 6. GRAND ART DECO BEACHFRONT HOTEL (HOTEL TRAYMORE 1935)      */}
      {/* ------------------------------------------------------------- */}
      <g id="traymoreHotel" transform="translate(480, 150)">
        {/* Ground Shadow */}
        <polygon points="-120,210 120,210 160,235 -80,235" fill="#0f172a" opacity="0.25" />

        {/* Central Tower Tier 1 (Base) */}
        <rect x="-110" y="90" width="220" height="120" rx="3" fill="url(#hotelDecoFacade)" stroke="#ca8a04" strokeWidth="1.2" />
        {/* Tier 2 (Step-back) */}
        <rect x="-85" y="45" width="170" height="50" rx="2" fill="url(#hotelDecoFacade)" stroke="#ca8a04" strokeWidth="1.2" />
        {/* Tier 3 (Apex Tower) */}
        <rect x="-55" y="10" width="110" height="40" rx="2" fill="url(#hotelDecoFacade)" stroke="#ca8a04" strokeWidth="1.2" />

        {/* Grand Turquoise Copper Cupola Dome */}
        <path d="M -30 10 Q 0 -25 30 10 Z" fill="#0d9488" stroke="#115e59" strokeWidth="1.5" />
        <circle cx="0" cy="-25" r="3.5" fill="#f59e0b" />
        <line x1="0" y1="-25" x2="0" y2="-38" stroke="#f59e0b" strokeWidth="2" />
        {/* Twin Flanking Turquoise Cupolas */}
        <path d="M -80 45 Q -65 25 -50 45 Z" fill="#0d9488" stroke="#115e59" strokeWidth="1.2" />
        <path d="M 50 45 Q 65 25 80 45 Z" fill="#0d9488" stroke="#115e59" strokeWidth="1.2" />

        {/* Striped Beach Canvas Awnings on First Floor */}
        {[-85, -45, -5, 35, 75].map((xPos, idx) => (
          <g key={`awning_${idx}`} transform={`translate(${xPos}, 145)`}>
            <polygon points="0,0 25,0 30,12 5,12" fill={idx % 2 === 0 ? "#dc2626" : "#2563eb"} stroke="#1e293b" strokeWidth="0.6" />
            <polygon points="5,0 12,0 17,12 10,12" fill="#ffffff" />
            <polygon points="17,0 24,0 29,12 22,12" fill="#ffffff" />
          </g>
        ))}

        {/* Hotel Gridded Rows of Art Deco Windows */}
        {[-70, -45, -20, 5, 30, 55].map((colX, cIdx) => (
          <g key={`col_${cIdx}`}>
            {[105, 125, 165, 185].map((rowY, rIdx) => (
              <rect
                key={`win_${cIdx}_${rIdx}`}
                x={colX}
                y={rowY}
                width="14"
                height="12"
                rx="1"
                fill="#0284c7"
                stroke="#1e293b"
                strokeWidth="0.6"
              />
            ))}
          </g>
        ))}

        {/* Grand Arched Front Entrance Colonnade */}
        <rect x="-35" y="180" width="70" height="30" rx="3" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
        <path d="M -18 210 L -18 190 A 18 18 0 0 1 18 190 L 18 210 Z" fill="#451a03" stroke="#ca8a04" strokeWidth="1" />
        {/* Hotel Marquee Sign */}
        <rect x="-50" y="165" width="100" height="14" rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
        <text x="0" y="175" fill="#fef08a" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8">
          HOTEL TRAYMORE • 1935
        </text>
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 7. READING RAILROAD 1930s STEAM ENGINE CROSSING BRICK BRIDGE   */}
      {/* ------------------------------------------------------------- */}
      <g id="readingRailroadTrain" transform="translate(320, 310)">
        {/* Arched Brick Railway Bridge Viaduct */}
        <rect x="-140" y="32" width="280" height="28" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
        {/* Brick Texture Arches */}
        {[-100, -50, 0, 50, 100].map((archX, aIdx) => (
          <path
            key={`arch_${aIdx}`}
            d={`M ${archX - 18} 60 A 18 18 0 0 1 ${archX + 18} 60 Z`}
            fill="#0369a1"
            stroke="#7f1d1d"
            strokeWidth="1.5"
          />
        ))}
        {/* Steel Rail Track */}
        <line x1="-140" y1="30" x2="140" y2="30" stroke="#475569" strokeWidth="2" />
        <line x1="-140" y1="33" x2="140" y2="33" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

        {/* Vintage Steam Train Locomotive */}
        <g transform="translate(35, 10)">
          {/* Boiler Body */}
          <rect x="-45" y="0" width="55" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          {/* Cab */}
          <rect x="-65" y="-8" width="24" height="26" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="-60" y="-4" width="10" height="8" rx="1" fill="#fef08a" opacity="0.9" />
          {/* Smokestack */}
          <rect x="-15" y="-12" width="8" height="14" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          {/* Red Cowcatcher */}
          <polygon points="10,8 20,18 8,18" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
          {/* Headlamp */}
          <circle cx="12" cy="8" r="3.5" fill="#fef08a" stroke="#eab308" strokeWidth="1" filter="url(#coastalGlow)" />
          {/* Drive Wheels with Connecting Rod */}
          <circle cx="-35" cy="18" r="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="-18" cy="18" r="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="-2" cy="18" r="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="-35" y1="18" x2="-2" y2="18" stroke="#ef4444" strokeWidth="1.8" />

          {/* Coal Tender Car */}
          <rect x="-105" y="3" width="36" height="15" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <circle cx="-95" cy="18" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="-78" cy="18" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />

          {/* Billowing White Steam Puffs into the Sky */}
          <circle cx="-12" cy="-18" r="7" fill="#ffffff" opacity="0.85" />
          <circle cx="-22" cy="-28" r="10" fill="#ffffff" opacity="0.75" />
          <circle cx="-36" cy="-38" r="14" fill="#ffffff" opacity="0.6" />
          <circle cx="-54" cy="-48" r="18" fill="#ffffff" opacity="0.4" />
        </g>
      </g>

      {/* ------------------------------------------------------------- */}
      {/* 8. ARCHITECTURAL GILDED BRASS PLAQUE (ممشى أتلانتيك سيتي 1935)*/}
      {/* ------------------------------------------------------------- */}
      <g transform="translate(600, 715)">
        <rect
          x="-190"
          y="-13"
          width="380"
          height="26"
          rx="13"
          fill="#081021"
          stroke="#f59e0b"
          strokeWidth="1.6"
          filter="url(#coastalGlow)"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="11"
          fontWeight="900"
          letterSpacing="0.8"
        >
          ممشى أتلانتيك سيتي التاريخي 1935 • ATLANTIC CITY BOARDWALK 🎩
        </text>
      </g>
    </g>
  );
}
