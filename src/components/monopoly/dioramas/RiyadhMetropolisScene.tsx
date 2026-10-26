import React from "react";

/**
 * RiyadhMetropolisScene.tsx
 * Authentic 3D Living Metropolis Diorama for Riyadh VIP Monopoly (عقارات الرياض: بنك الحظ الأصيل 🏙️)
 * Features:
 * - Distant Tuwaiq mountain ridge silhouette
 * - Master 3D sandstone diorama pedestal base
 * - Wadi Hanifa waterway with azure river channel & Diriyah stone bridge
 * - King Fahd Road arterial highway with automated Riyadh Metro & miniature vehicles
 * - Kingdom Centre (برج المملكة) with inverted parabolic arch & skybridge
 * - King Abdullah Financial District (KAFD) crystalline towers
 * - Al Faisaliah (برج الفيصلية) pyramid with golden geodesic sphere
 * - Boulevard City sports stadium & amphitheater
 * - Historic Diriyah & At-Turaif clay mud-brick fortress citadel & palm groves
 */
export default function RiyadhMetropolisScene() {
  return (
    <g id="riyadhMetropolisScene">
      <defs>
        {/* Distant Tuwaiq Mountain Gradients */}
        <linearGradient id="tuwaiqRidgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cfbaa0" />
          <stop offset="100%" stopColor="#bfa588" />
        </linearGradient>

        <linearGradient id="wadiHanifaWater" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="30%" stopColor="#0ea5e9" />
          <stop offset="65%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        <linearGradient id="wadiHanifaDeep" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>

        <linearGradient id="sandStoneTerrain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7efe1" />
          <stop offset="45%" stopColor="#ede1cc" />
          <stop offset="100%" stopColor="#dfcfb2" />
        </linearGradient>

        <linearGradient id="diriyahCliffOchre" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="40%" stopColor="#b45309" />
          <stop offset="80%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        <linearGradient id="najdiClayWall" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="35%" stopColor="#d97706" />
          <stop offset="70%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>

        <linearGradient id="najdiSunlitRoof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <linearGradient id="lushParkGrass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="40%" stopColor="#22c55e" />
          <stop offset="80%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        <linearGradient id="golfCourseFairway" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="50%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>

        <linearGradient id="asphaltHighway" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="30%" stopColor="#334155" />
          <stop offset="70%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id="kingdomSunlitWing" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#e0f2fe" />
          <stop offset="65%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="kingdomShadowWing" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>

        <linearGradient id="kafdTowerCrystalline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#a5f3fc" />
          <stop offset="70%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        <linearGradient id="kafdPrismShard" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>

        <linearGradient id="faisaliahPyramid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="45%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="faisaliahGoldBall" x1="30%" y1="20%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="90%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        <linearGradient id="goldFoilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <pattern id="plazaPavingGrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="none" stroke="#d5c4a6" strokeWidth="0.6" opacity="0.45" />
        </pattern>
      </defs>

      {/* Distant Tuwaiq Mountain Ridge Silhouette */}
      <path
        d="M 0 170 Q 140 145 280 162 T 580 148 T 880 156 T 1200 145 L 1200 230 L 0 230 Z"
        fill="url(#tuwaiqRidgeGrad)"
        opacity="0.35"
      />
      <path
        d="M 0 185 Q 200 168 400 180 T 800 172 T 1200 182 L 1200 240 L 0 240 Z"
        fill="url(#tuwaiqRidgeGrad)"
        opacity="0.4"
      />

      {/* ------------------------------------------------------------- */}
      {/* LAYER 1: 3D DIORAMA PEDESTAL & TOPOGRAPHICAL TERRAIN BASE     */}
      {/* ------------------------------------------------------------- */}
      <polygon points="20,210 1180,210 1180,740 20,740" fill="url(#sandStoneTerrain)" />
      <rect x="20" y="210" width="1160" height="530" fill="url(#plazaPavingGrid)" />
      <polygon points="20,740 1180,740 1170,768 30,768" fill="#8c6c4c" />
      <polygon points="30,768 1170,768 1160,776 40,776" fill="#5a422d" />
      <polyline points="20,210 1180,210 1180,740 20,740 20,210" fill="none" stroke="url(#goldFoilGrad)" strokeWidth="3.5" opacity="0.8" />
      <polyline points="26,216 1174,216 1174,734 26,734 26,216" fill="none" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" />

      {/* ------------------------------------------------------------- */}
      {/* LAYER 2: LUSH NATURE, KING SALMAN PARK & FAIRWAYS             */}
      {/* ------------------------------------------------------------- */}
      <path d="M 40 220 C 130 250, 70 380, 140 500 C 180 580, 120 680, 150 740 L 40 740 Z" fill="url(#lushParkGrass)" opacity="0.85" />
      <path d="M 520 340 C 620 320, 720 330, 810 370 C 840 440, 790 520, 710 540 C 610 560, 530 500, 510 420 Z" fill="url(#lushParkGrass)" filter="url(#buildingCastShadow)" />
      <ellipse cx="660" cy="430" rx="95" ry="60" fill="url(#golfCourseFairway)" />
      <ellipse cx="660" cy="430" rx="45" ry="28" fill="#a7f3d0" opacity="0.6" />
      <circle cx="660" cy="430" r="14" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
      <circle cx="660" cy="430" r="5" fill="#e0f2fe" />
      <path d="M 850 460 C 930 430, 1060 450, 1140 510 C 1150 630, 1020 710, 910 690 C 840 680, 810 570, 850 460 Z" fill="url(#lushParkGrass)" opacity="0.9" />

      {/* ------------------------------------------------------------- */}
      {/* LAYER 3: WADI HANIFAH LIVING WATERWAY & PROMENADES            */}
      {/* ------------------------------------------------------------- */}
      <path d="M 120 200 C 180 280, 130 360, 190 470 C 240 560, 200 660, 260 750" fill="none" stroke="#075985" strokeWidth="48" strokeLinecap="round" opacity="0.4" filter="url(#buildingCastShadow)" />
      <path d="M 120 200 C 180 280, 130 360, 190 470 C 240 560, 200 660, 260 750" fill="none" stroke="#e7d5b8" strokeWidth="42" strokeLinecap="round" />
      <path d="M 120 200 C 180 280, 130 360, 190 470 C 240 560, 200 660, 260 750" fill="none" stroke="url(#wadiHanifaWater)" strokeWidth="28" strokeLinecap="round" />
      <path d="M 120 200 C 180 280, 130 360, 190 470 C 240 560, 200 660, 260 750" fill="none" stroke="url(#wadiHanifaDeep)" strokeWidth="14" strokeLinecap="round" opacity="0.75" />
      <path d="M 130 240 Q 145 235 160 242 M 140 310 Q 155 305 170 312 M 160 400 Q 175 395 190 402 M 200 500 Q 215 495 230 502 M 225 610 Q 240 605 255 612" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75" />
      <text x="120" y="630" fill="#0369a1" fontSize="9.5" fontWeight="900" letterSpacing="1.5" transform="rotate(68 120 630)" opacity="0.8">
        ممشى وادي حنيفة البيئي • WADI HANIFAH
      </text>

      {/* ------------------------------------------------------------- */}
      {/* LAYER 4: HIGHWAYS, BRIDGES & MINIATURE TRAFFIC                */}
      {/* ------------------------------------------------------------- */}
      <path d="M 440 200 L 470 420 L 510 750" fill="none" stroke="#0f172a" strokeWidth="38" opacity="0.28" filter="url(#buildingCastShadow)" />
      <path d="M 440 200 L 470 420 L 510 750" fill="none" stroke="url(#asphaltHighway)" strokeWidth="32" strokeLinecap="square" />
      <path d="M 426 200 L 456 420 L 496 750" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.75" />
      <path d="M 454 200 L 484 420 L 524 750" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.75" />
      <path d="M 440 200 L 470 420 L 510 750" fill="none" stroke="#f59e0b" strokeWidth="2.2" />
      <path d="M 433 200 L 463 420 L 503 750" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="8 7" opacity="0.8" />
      <path d="M 447 200 L 477 420 L 517 750" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="8 7" opacity="0.8" />

      {/* Historic Diriyah Stone Arch Bridge */}
      <g id="diriyahStoneBridge" transform="translate(140, 345)">
        <rect x="-24" y="-8" width="55" height="16" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="0.8" />
        <circle cx="-12" cy="7" r="5" fill="#0284c7" />
        <circle cx="3" cy="7" r="5" fill="#0284c7" />
        <circle cx="18" cy="7" r="5" fill="#0284c7" />
        <path d="M -17 7 A 5 5 0 0 1 -7 7 M -2 7 A 5 5 0 0 1 8 7 M 13 7 A 5 5 0 0 1 23 7" stroke="#78350f" strokeWidth="1.4" fill="none" />
      </g>

      {/* Elevated Riyadh Metro Guideway & Automated Train */}
      <g id="riyadhMetroTrain">
        <line x1="400" y1="210" x2="430" y2="750" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
        <line x1="400" y1="210" x2="430" y2="750" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 7" />
        <g transform="translate(416, 440) rotate(14)">
          <rect x="-3" y="-12" width="12" height="42" rx="4" fill="#0f172a" opacity="0.4" />
          <rect x="-6" y="-18" width="12" height="40" rx="5" fill="#ffffff" stroke="#0284c7" strokeWidth="1.2" />
          <rect x="-5" y="-14" width="10" height="6" rx="2" fill="#38bdf8" />
          <rect x="-5" y="-4" width="10" height="6" rx="2" fill="#0284c7" />
          <rect x="-5" y="6" width="10" height="6" rx="2" fill="#0284c7" />
          <rect x="-5" y="14" width="10" height="4" rx="2" fill="#38bdf8" />
          <circle cx="-3" cy="22" r="1.5" fill="#fef08a" />
          <circle cx="3" cy="22" r="1.5" fill="#fef08a" />
        </g>
      </g>

      {/* Miniature 3D Vehicles on Highway */}
      <g transform="translate(433, 310) rotate(7)">
        <ellipse cx="6" cy="12" rx="7" ry="14" fill="#0f172a" opacity="0.35" />
        <rect x="0" y="0" width="11" height="20" rx="3.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
        <rect x="1.5" y="3" width="8" height="5" rx="1.5" fill="#38bdf8" opacity="0.75" />
        <rect x="1.5" y="11" width="8" height="5" rx="1.5" fill="#1e293b" />
        <circle cx="2" cy="1" r="1.2" fill="#fef08a" />
        <circle cx="9" cy="1" r="1.2" fill="#fef08a" />
      </g>
      <g transform="translate(450, 490) rotate(187)">
        <ellipse cx="6" cy="12" rx="7" ry="14" fill="#0f172a" opacity="0.35" />
        <rect x="0" y="0" width="10" height="19" rx="3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
        <rect x="1.5" y="3" width="7" height="4" rx="1" fill="#38bdf8" opacity="0.7" />
        <rect x="3.5" y="9" width="3" height="3" fill="#1e293b" />
        <circle cx="2" cy="18" r="1.2" fill="#ef4444" />
        <circle cx="8" cy="18" r="1.2" fill="#ef4444" />
      </g>
      <g transform="translate(476, 360) rotate(7)">
        <ellipse cx="5" cy="10" rx="6" ry="12" fill="#0f172a" opacity="0.35" />
        <rect x="0" y="0" width="9" height="17" rx="3" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
        <rect x="1.5" y="4" width="6" height="5" rx="1.5" fill="#1e293b" />
        <circle cx="2" cy="1" r="1.2" fill="#fef08a" />
        <circle cx="7" cy="1" r="1.2" fill="#fef08a" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* LAYER 5: ICONIC ARCHITECTURAL 3D SKYSCRAPERS & LANDMARKS      */}
      {/* ------------------------------------------------------------- */}

      {/* 1. KINGDOM CENTRE (برج المملكة) */}
      <g id="landmarkKingdomCentre" transform="translate(590, 70)">
        <polygon points="0,230 45,230 110,265 60,265" fill="#0f172a" opacity="0.32" filter="url(#buildingCastShadow)" />
        <path d="M -30 230 L -24 95 Q -20 45 -5 12 L 0 12 L 0 75 Q -14 100 -14 140 L -18 230 Z" fill="url(#kingdomSunlitWing)" stroke="#ffffff" strokeWidth="0.8" />
        <path d="M 30 230 L 24 95 Q 20 45 5 12 L 0 12 L 0 75 Q 14 100 14 140 L 18 230 Z" fill="url(#kingdomShadowWing)" stroke="#0284c7" strokeWidth="0.8" />
        <line x1="-26" y1="130" x2="-14" y2="130" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
        <line x1="-24" y1="170" x2="-16" y2="170" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
        <line x1="-22" y1="205" x2="-17" y2="205" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
        <line x1="14" y1="130" x2="26" y2="130" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
        <line x1="16" y1="170" x2="24" y2="170" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
        <path d="M 0 75 Q -14 100 -14 140 L 14 140 Q 14 100 0 75 Z" fill="#67e8f9" opacity="0.35" />
        <rect x="-8" y="10" width="16" height="5" rx="1.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.8" filter="url(#goldGleam)" />
        <line x1="0" y1="10" x2="0" y2="2" stroke="#d97706" strokeWidth="1.2" />
        <circle cx="0" cy="1" r="2.5" fill="#ef4444" filter="url(#dioramaSunGlow)" />
        <g transform="translate(0, 245)">
          <rect x="-65" y="-10" width="130" height="20" rx="10" fill="#081021" stroke="url(#goldFoilGrad)" strokeWidth="1.2" filter="url(#goldGleam)" />
          <text x="0" y="3" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="900" letterSpacing="0.5">
            برج المملكة • KINGDOM
          </text>
        </g>
      </g>

      {/* 2. KING ABDULLAH FINANCIAL DISTRICT (KAFD) */}
      <g id="landmarkKAFD" transform="translate(740, 100)">
        <polygon points="-40,190 85,190 140,225 10,225" fill="#0f172a" opacity="0.32" filter="url(#buildingCastShadow)" />
        <g id="kafdTower1" transform="translate(0, 0)">
          <polygon points="-24,190 -16,45 8,20 18,190" fill="url(#kafdTowerCrystalline)" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="8,20 28,45 18,190" fill="url(#kafdPrismShard)" stroke="#0284c7" strokeWidth="0.8" />
          <line x1="-16" y1="45" x2="28" y2="45" stroke="#ffffff" strokeWidth="1" />
          <polygon points="-16,45 8,20 0,6" fill="#fef08a" opacity="0.9" />
          <polygon points="8,20 28,45 0,6" fill="#f59e0b" opacity="0.75" />
        </g>
        <g id="kafdTower2" transform="translate(42, 35)">
          <polygon points="-14,155 -10,25 6,8 14,155" fill="url(#kafdTowerCrystalline)" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="6,8 18,25 14,155" fill="url(#kafdPrismShard)" stroke="#0284c7" strokeWidth="0.8" />
        </g>
        <g id="kafdTower3" transform="translate(-32, 50)">
          <polygon points="-12,140 -8,28 4,14 10,140" fill="url(#kafdTowerCrystalline)" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="4,14 14,28 10,140" fill="url(#kafdPrismShard)" stroke="#0284c7" strokeWidth="0.8" />
        </g>
        <g transform="translate(10, 215)">
          <rect x="-82" y="-10" width="164" height="20" rx="10" fill="#081021" stroke="url(#goldFoilGrad)" strokeWidth="1.2" filter="url(#goldGleam)" />
          <text x="0" y="3" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="900" letterSpacing="0.4">
            مركز الملك عبدالله المالي KAFD
          </text>
        </g>
      </g>

      {/* 3. AL FAISALIAH PYRAMID (برج الفيصلية) */}
      <g id="landmarkFaisaliah" transform="translate(930, 130)">
        <polygon points="-25,160 25,160 70,195 20,195" fill="#0f172a" opacity="0.32" filter="url(#buildingCastShadow)" />
        <polygon points="-28,160 0,6 0,160" fill="url(#faisaliahPyramid)" stroke="#ffffff" strokeWidth="0.8" />
        <polygon points="0,6 28,160 0,160" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
        <circle cx="0" cy="42" r="14" fill="#0f172a" opacity="0.4" />
        <circle cx="0" cy="42" r="12" fill="url(#faisaliahGoldBall)" stroke="#ffffff" strokeWidth="1" filter="url(#goldGleam)" />
        <ellipse cx="-3" cy="38" rx="4" ry="2" fill="#ffffff" opacity="0.8" />
        <line x1="0" y1="6" x2="0" y2="-12" stroke="#d97706" strokeWidth="1.5" />
        <circle cx="0" cy="-12" r="2.5" fill="#ef4444" filter="url(#dioramaSunGlow)" />
        <g transform="translate(0, 185)">
          <rect x="-65" y="-10" width="130" height="20" rx="10" fill="#081021" stroke="url(#goldFoilGrad)" strokeWidth="1.2" filter="url(#goldGleam)" />
          <text x="0" y="3" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="900" letterSpacing="0.4">
            برج الفيصلية • FAISALIAH
          </text>
        </g>
      </g>

      {/* 4. BOULEVARD CITY & STADIUM (بوليفارد سيتي) */}
      <g id="landmarkBoulevard" transform="translate(860, 460)">
        <ellipse cx="110" cy="65" rx="90" ry="45" fill="#0f172a" opacity="0.32" filter="url(#buildingCastShadow)" />
        <ellipse cx="110" cy="60" rx="85" ry="42" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.8" />
        <ellipse cx="110" cy="60" rx="72" ry="34" fill="#1e293b" />
        <ellipse cx="110" cy="60" rx="55" ry="24" fill="url(#lushParkGrass)" stroke="#ffffff" strokeWidth="1.2" />
        <ellipse cx="110" cy="60" rx="20" ry="10" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
        <ellipse cx="115" cy="30" rx="36" ry="16" fill="url(#wadiHanifaWater)" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="115" cy="30" r="4" fill="#ffffff" filter="url(#goldGleam)" />
        <g transform="translate(130, 225)">
          <rect x="-82" y="-10" width="164" height="20" rx="10" fill="#081021" stroke="url(#goldFoilGrad)" strokeWidth="1.2" filter="url(#goldGleam)" />
          <text x="0" y="3" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="900" letterSpacing="0.4">
            بوليفارد سيتي واستاد الرياض
          </text>
        </g>
      </g>

      {/* 5. HISTORIC DIRIYAH & AT-TURAIF (حي الطريف والدرعية التاريخية) */}
      <g id="landmarkDiriyah" transform="translate(45, 235)">
        <polygon points="10,65 180,65 190,145 0,145" fill="url(#diriyahCliffOchre)" stroke="#78350f" strokeWidth="1" />
        <polygon points="0,145 190,145 220,175 25,175" fill="#0f172a" opacity="0.32" filter="url(#buildingCastShadow)" />
        <polygon points="18,12 38,12 42,95 14,95" fill="url(#najdiClayWall)" stroke="#78350f" strokeWidth="0.8" />
        <polygon points="18,12 22,6 26,12" fill="url(#najdiSunlitRoof)" />
        <polygon points="26,12 30,6 34,12" fill="url(#najdiSunlitRoof)" />
        <polygon points="34,12 38,6 42,12" fill="url(#najdiSunlitRoof)" />
        <polygon points="40,25 145,25 150,95 40,95" fill="url(#najdiClayWall)" stroke="#78350f" strokeWidth="0.8" />
        <polygon points="55,42 61,50 49,50" fill="#451a03" />
        <polygon points="75,38 81,46 69,46" fill="#451a03" />
        <polygon points="95,42 101,50 89,50" fill="#451a03" />
        <polygon points="115,38 121,46 109,46" fill="#451a03" />
        <polygon points="135,42 141,50 129,50" fill="#451a03" />
        <polygon points="145,15 168,15 174,95 142,95" fill="url(#najdiClayWall)" stroke="#78350f" strokeWidth="0.8" />
        <rect x="85" y="60" width="16" height="35" rx="3" fill="#451a03" stroke="#78350f" strokeWidth="1" />
        <circle cx="98" cy="78" r="1.5" fill="#f59e0b" />
        <g id="diriyahPalm1" transform="translate(182, 50)">
          <path d="M 0 38 Q 4 18 0 0" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 0 0 Q -12 -5 -16 6 M 0 0 Q -8 -14 -12 -18 M 0 0 Q 0 -18 4 -20 M 0 0 Q 10 -15 15 -10 M 0 0 Q 16 -3 18 7" stroke="#22c55e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(90, 160)">
          <rect x="-78" y="-10" width="156" height="20" rx="10" fill="#081021" stroke="url(#goldFoilGrad)" strokeWidth="1.2" filter="url(#goldGleam)" />
          <text x="0" y="3" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="900" letterSpacing="0.4">
            حي الطريف بالدرعية • DIRIYAH
          </text>
        </g>
      </g>

      {/* ------------------------------------------------------------- */}
      {/* LAYER 6: PALM GROVES & SPHERICAL 3D TREES IN KING SALMAN PARK */}
      {/* ------------------------------------------------------------- */}
      <g id="canopyTree1" transform="translate(540, 360)">
        <ellipse cx="6" cy="14" rx="10" ry="5" fill="#0f172a" opacity="0.25" filter="url(#softTreeShadow)" />
        <circle cx="0" cy="0" r="10" fill="#15803d" />
        <circle cx="-2" cy="-3" r="8" fill="#22c55e" />
        <circle cx="-4" cy="-5" r="5" fill="#86efac" />
      </g>
      <g id="canopyTree2" transform="translate(760, 370)">
        <ellipse cx="6" cy="14" rx="11" ry="5.5" fill="#0f172a" opacity="0.25" filter="url(#softTreeShadow)" />
        <circle cx="0" cy="0" r="11" fill="#15803d" />
        <circle cx="-2" cy="-3" r="9" fill="#22c55e" />
        <circle cx="-4" cy="-5" r="5" fill="#86efac" />
      </g>
      <g id="canopyTree3" transform="translate(690, 520)">
        <ellipse cx="6" cy="14" rx="9" ry="4.5" fill="#0f172a" opacity="0.25" filter="url(#softTreeShadow)" />
        <circle cx="0" cy="0" r="9" fill="#15803d" />
        <circle cx="-2" cy="-3" r="7" fill="#22c55e" />
        <circle cx="-4" cy="-4" r="4" fill="#86efac" />
      </g>
    </g>
  );
}
