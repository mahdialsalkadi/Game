"use client";

import React from "react";
import { motion } from "framer-motion";

export default function RiyadhSkylineMap() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none rounded-2xl">
      {/* 1. Deep Atmospheric Night Canvas Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#111c38_0%,#080e1e_55%,#03060d_100%)] opacity-95" />

      {/* 2. Architectural Blueprint Grid & Technical Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="archBlueprintGrid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#D97706"
              strokeWidth="0.5"
              strokeDasharray="1 3"
              opacity="0.35"
            />
          </pattern>
          <pattern
            id="majorGrid"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 120 0 L 0 0 0 120"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="0.8"
              opacity="0.3"
            />
          </pattern>
          <linearGradient id="neonCyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="trafficGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="trafficRed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F87171" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="goldFiligree" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#archBlueprintGrid)" />
        <rect width="100%" height="100%" fill="url(#majorGrid)" />
      </svg>

      {/* 3. Master Vector Cartography & Illustrated Landmarks */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 650"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glowing Filters */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients for Landmarks */}
          <linearGradient id="kingdomTowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="40%" stopColor="#64748B" />
            <stop offset="85%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="skybridgeGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="kafdGlassGrad" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#0369A1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="diriyahMudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="60%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="boulevardNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <radialGradient id="searchlightBeam" cx="50%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- Topographic Wadi Hanifah Valley Contour (West flank) --- */}
        <path
          d="M 60 -50 C 90 120, 40 280, 110 420 C 150 500, 90 620, 130 720"
          fill="none"
          stroke="#10B981"
          strokeWidth="38"
          strokeOpacity="0.08"
          strokeLinecap="round"
        />
        <path
          d="M 60 -50 C 90 120, 40 280, 110 420 C 150 500, 90 620, 130 720"
          fill="none"
          stroke="#059669"
          strokeWidth="4"
          strokeDasharray="6 8"
          strokeOpacity="0.25"
        />
        <text
          x="75"
          y="490"
          fill="#34D399"
          fontSize="9"
          fontWeight="bold"
          letterSpacing="2"
          opacity="0.4"
          transform="rotate(65 75 490)"
        >
          وادي حنيفة • WADI HANIFAH GREEN CORRIDOR
        </text>

        {/* --- King Fahd Arterial Highway (Sweeping Central Spine) --- */}
        {/* Highway Asphalt Base */}
        <path
          d="M 460 -40 L 490 280 L 520 690"
          fill="none"
          stroke="#0F172A"
          strokeWidth="28"
          strokeOpacity="0.9"
        />
        <path
          d="M 460 -40 L 490 280 L 520 690"
          fill="none"
          stroke="#334155"
          strokeWidth="24"
        />
        {/* Median Barrier */}
        <path
          d="M 460 -40 L 490 280 L 520 690"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.8"
          strokeOpacity="0.8"
        />
        {/* Traffic North (Headlights - Warm Gold Light Beam) */}
        <path
          d="M 454 -40 L 484 280 L 514 690"
          fill="none"
          stroke="url(#trafficGold)"
          strokeWidth="2.5"
          strokeDasharray="18 10"
          strokeOpacity="0.85"
          filter="url(#softGlow)"
        />
        {/* Traffic South (Taillights - Crimson Ruby Light Beam) */}
        <path
          d="M 466 -40 L 496 280 L 526 690"
          fill="none"
          stroke="url(#trafficRed)"
          strokeWidth="2.5"
          strokeDasharray="14 8"
          strokeOpacity="0.85"
          filter="url(#softGlow)"
        />
        <text
          x="440"
          y="620"
          fill="#FDE68A"
          fontSize="9"
          fontWeight="bold"
          letterSpacing="1"
          opacity="0.6"
          transform="rotate(85 440 620)"
        >
          طريق الملك فهد • KING FAHD ROAD
        </text>

        {/* --- Olaya Street Arterial Avenue (Eastern Parallel) --- */}
        <path
          d="M 580 -40 L 610 280 L 640 690"
          fill="none"
          stroke="#1E293B"
          strokeWidth="16"
        />
        <path
          d="M 580 -40 L 610 280 L 640 690"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.2"
          strokeDasharray="12 12"
          strokeOpacity="0.4"
        />
        <text
          x="575"
          y="120"
          fill="#38BDF8"
          fontSize="8"
          fontWeight="bold"
          opacity="0.45"
          transform="rotate(85 575 120)"
        >
          شارع العليا التجاري • OLAYA AVE
        </text>

        {/* --- Riyadh Metro Blue Line Viaduct (Cyan Monorail / Rapid Transit) --- */}
        <path
          d="M 420 -40 L 440 280 L 460 690"
          fill="none"
          stroke="#0284C7"
          strokeWidth="3.5"
          strokeOpacity="0.4"
        />
        <path
          d="M 420 -40 L 440 280 L 460 690"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          filter="url(#softGlow)"
        />

        {/* --- Ring Road Junction / Northern Ring Interchange --- */}
        <path
          d="M -40 210 Q 500 240 1040 210"
          fill="none"
          stroke="#1E293B"
          strokeWidth="20"
          strokeOpacity="0.75"
        />
        <path
          d="M -40 210 Q 500 240 1040 210"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.2"
          strokeDasharray="8 6"
          strokeOpacity="0.5"
        />
        <text
          x="820"
          y="230"
          fill="#94A3B8"
          fontSize="8.5"
          fontWeight="bold"
          letterSpacing="1"
          opacity="0.5"
        >
          الطريق الدائري الشمالي • NORTHERN RING RD
        </text>

        {/* ============================================================== */}
        {/* LANDMARK 1: THE ICONIC KINGDOM CENTRE (برج المملكة)             */}
        {/* ============================================================== */}
        <g id="kingdomCentreLandmark" transform="translate(485, 20)">
          {/* Soft Evening Sky Glow */}
          <circle cx="0" cy="80" r="110" fill="#38BDF8" opacity="0.08" filter="url(#intenseGlow)" />

          {/* Tower Silhouette (Iconic Parabolic Inverted Arch) */}
          {/* Left Wing Pillar */}
          <path
            d="M -22 170 L -18 70 Q -15 35 -4 10 L 0 10 L 0 55 Q -10 75 -10 105 L -14 170 Z"
            fill="url(#kingdomTowerGrad)"
            stroke="#94A3B8"
            strokeWidth="0.8"
          />
          {/* Right Wing Pillar */}
          <path
            d="M 22 170 L 18 70 Q 15 35 4 10 L 0 10 L 0 55 Q 10 75 10 105 L 14 170 Z"
            fill="url(#kingdomTowerGrad)"
            stroke="#94A3B8"
            strokeWidth="0.8"
          />

          {/* Golden Skybridge Observation Deck */}
          <path
            d="M -6 10 L 6 10 L 5 18 L -5 18 Z"
            fill="url(#skybridgeGold)"
            stroke="#FDE68A"
            strokeWidth="0.8"
            filter="url(#softGlow)"
          />
          {/* Skybridge Light Windows */}
          <rect x="-4" y="12" width="8" height="3" fill="#FFFBEB" filter="url(#softGlow)" />

          {/* Inverted Arch Opening Cutout Glow */}
          <path
            d="M -10 55 Q 0 75 10 55 Q 5 22 0 18 Q -5 22 -10 55 Z"
            fill="#38BDF8"
            opacity="0.18"
            filter="url(#softGlow)"
          />

          {/* Modern Glass Facade Stripes */}
          <line x1="-14" y1="90" x2="-10" y2="90" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" />
          <line x1="10" y1="90" x2="14" y2="90" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" />
          <line x1="-15" y1="120" x2="-9" y2="120" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" />
          <line x1="9" y1="120" x2="15" y2="120" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" />
          <line x1="-16" y1="150" x2="-8" y2="150" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" />
          <line x1="8" y1="150" x2="16" y2="150" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" />

          {/* Rooftop Aviation Safety Red Beacons */}
          <circle cx="0" cy="8" r="1.5" fill="#EF4444" filter="url(#softGlow)" />

          {/* Gilded Landmark Label Badge */}
          <rect
            x="-65"
            y="178"
            width="130"
            height="18"
            rx="9"
            fill="#090E1A"
            stroke="#F59E0B"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />
          <text
            x="0"
            y="190"
            textAnchor="middle"
            fill="#FDE68A"
            fontSize="8"
            fontWeight="bold"
            letterSpacing="0.5"
          >
            برج المملكة • KINGDOM TOWER
          </text>
        </g>

        {/* ============================================================== */}
        {/* LANDMARK 2: KAFD FINANCIAL DISTRICT TOWERS (مركز الملك عبدالله) */}
        {/* ============================================================== */}
        <g id="kafdLandmark" transform="translate(230, 45)">
          {/* Financial Cluster Sky Glow */}
          <ellipse cx="60" cy="90" rx="90" ry="70" fill="#0284C7" opacity="0.12" filter="url(#intenseGlow)" />

          {/* Tower 1: The Iconic PIF Tower (Angular Crystalline Apex) */}
          <polygon
            points="55,10 75,35 70,150 40,150 35,35"
            fill="url(#kafdGlassGrad)"
            stroke="#38BDF8"
            strokeWidth="0.8"
          />
          {/* Crystalline Facet Triangles */}
          <polygon points="55,10 75,35 55,50" fill="#7DD3FC" opacity="0.4" />
          <polygon points="55,10 35,35 55,50" fill="#0284C7" opacity="0.6" />
          <line x1="55" y1="50" x2="55" y2="150" stroke="#38BDF8" strokeWidth="0.8" opacity="0.7" />

          {/* Tower 2: World Trade Center Riyadh (Hexagonal Geometry) */}
          <polygon
            points="85,30 102,48 98,155 74,155 72,48"
            fill="url(#kafdGlassGrad)"
            stroke="#0EA5E9"
            strokeWidth="0.7"
          />
          <polygon points="85,30 102,48 88,60" fill="#BAE6FD" opacity="0.35" />

          {/* Tower 3: Diamond Geometric Tower */}
          <polygon
            points="22,45 38,62 34,150 10,150 8,62"
            fill="url(#kafdGlassGrad)"
            stroke="#0284C7"
            strokeWidth="0.7"
          />

          {/* Futuristic KAFD Skybridges linking towers */}
          <line
            x1="34"
            y1="85"
            x2="72"
            y2="85"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#softGlow)"
          />
          <line
            x1="70"
            y1="110"
            x2="96"
            y2="110"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#softGlow)"
          />

          {/* District Title Badge */}
          <rect
            x="2"
            y="158"
            width="120"
            height="18"
            rx="9"
            fill="#090E1A"
            stroke="#38BDF8"
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />
          <text
            x="62"
            y="170"
            textAnchor="middle"
            fill="#E0F2FE"
            fontSize="8"
            fontWeight="bold"
            letterSpacing="0.5"
          >
            مركز الملك عبدالله المالي • KAFD
          </text>
        </g>

        {/* ============================================================== */}
        {/* LANDMARK 3: AL FAISALIAH TOWER & GOLDEN GLOBE (برج الفيصلية)   */}
        {/* ============================================================== */}
        <g id="faisaliahLandmark" transform="translate(710, 40)">
          {/* Golden Radiant Sky Halo */}
          <circle cx="40" cy="65" r="70" fill="#F59E0B" opacity="0.1" filter="url(#intenseGlow)" />

          {/* Pyramid Tapering Tower */}
          <polygon
            points="40,25 65,150 15,150"
            fill="url(#kingdomTowerGrad)"
            stroke="#CBD5E1"
            strokeWidth="0.8"
          />

          {/* The Iconic Golden Geodesic Sphere */}
          <circle
            cx="40"
            cy="55"
            r="12"
            fill="url(#goldFiligree)"
            stroke="#FEF08A"
            strokeWidth="1"
            filter="url(#softGlow)"
          />
          <ellipse cx="38" cy="52" rx="4" ry="2.5" fill="#FFFBEB" opacity="0.9" />

          {/* Tower Spire */}
          <line x1="40" y1="25" x2="40" y2="8" stroke="#FDE68A" strokeWidth="1.5" />
          <circle cx="40" cy="7" r="1.5" fill="#EF4444" filter="url(#softGlow)" />

          {/* Radiating Evening Searchlight Beams */}
          <path
            d="M 40 55 L 0 -20 L 25 -20 Z"
            fill="url(#searchlightBeam)"
            opacity="0.6"
          />
          <path
            d="M 40 55 L 85 -20 L 60 -20 Z"
            fill="url(#searchlightBeam)"
            opacity="0.6"
          />

          {/* Label Badge */}
          <rect
            x="-10"
            y="158"
            width="105"
            height="18"
            rx="9"
            fill="#090E1A"
            stroke="#F59E0B"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />
          <text
            x="42"
            y="170"
            textAnchor="middle"
            fill="#FEF3C7"
            fontSize="8"
            fontWeight="bold"
          >
            برج الفيصلية • AL FAISALIAH
          </text>
        </g>

        {/* ============================================================== */}
        {/* LANDMARK 4: HISTORIC DIRIYAH & AT-TURAIF (حي الطريف بالدرعية)  */}
        {/* ============================================================== */}
        <g id="diriyahLandmark" transform="translate(130, 240)">
          {/* Najdi Desert Warm Adobe Halo */}
          <ellipse cx="60" cy="40" rx="80" ry="40" fill="#D97706" opacity="0.1" filter="url(#softGlow)" />

          {/* Najdi Mud-Brick Fortress Battlements */}
          <path
            d="M 10 65 L 10 30 L 20 30 L 20 35 L 28 35 L 28 30 L 38 30 L 38 35 L 46 35 L 46 25 L 56 25 L 56 32 L 72 32 L 72 20 L 82 20 L 82 30 L 98 30 L 98 35 L 108 35 L 108 30 L 118 30 L 118 65 Z"
            fill="url(#diriyahMudGrad)"
            stroke="#78350F"
            strokeWidth="0.9"
          />
          {/* Traditional Triangular Najdi Openings (طاقات مثلثة) */}
          <polygon points="30,42 34,48 26,48" fill="#451A03" />
          <polygon points="48,38 52,44 44,44" fill="#451A03" />
          <polygon points="76,34 80,40 72,40" fill="#451A03" />
          <polygon points="94,42 98,48 90,48" fill="#451A03" />

          {/* Palm Trees of Diriyah */}
          <g transform="translate(125, 25)">
            <path d="M 0 40 Q 2 20 0 5" stroke="#78350F" strokeWidth="2.5" />
            <path d="M 0 5 Q -10 -2 -14 5 M 0 5 Q -6 -8 -8 -12 M 0 5 Q 0 -12 2 -14 M 0 5 Q 8 -10 12 -8 M 0 5 Q 12 0 14 6" stroke="#10B981" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>

          {/* Diriyah Title Badge */}
          <rect
            x="8"
            y="72"
            width="125"
            height="18"
            rx="9"
            fill="#1C1008"
            stroke="#D97706"
            strokeWidth="0.8"
          />
          <text
            x="70"
            y="84"
            textAnchor="middle"
            fill="#FDE68A"
            fontSize="8"
            fontWeight="bold"
          >
            الدرعية التاريخية • DIRIYAH HERITAGE
          </text>
        </g>

        {/* ============================================================== */}
        {/* LANDMARK 5: BOULEVARD CITY & RIYADH SEASON (بوليفارد سيتي)     */}
        {/* ============================================================== */}
        <g id="boulevardLandmark" transform="translate(680, 240)">
          {/* Vibrant Neon Glow */}
          <circle cx="65" cy="40" r="75" fill="#EC4899" opacity="0.12" filter="url(#intenseGlow)" />

          {/* The Famous Entertainment Sphere / Dome */}
          <circle
            cx="65"
            cy="40"
            r="26"
            fill="url(#boulevardNeonGrad)"
            stroke="#F472B6"
            strokeWidth="1.2"
            filter="url(#softGlow)"
          />
          <ellipse cx="65" cy="32" rx="14" ry="7" fill="#FFFFFF" opacity="0.4" />

          {/* Neon Billboard Towers */}
          <rect x="22" y="30" width="12" height="35" rx="2" fill="#0EA5E9" stroke="#38BDF8" strokeWidth="0.8" />
          <rect x="96" y="24" width="14" height="41" rx="2" fill="#8B5CF6" stroke="#C084FC" strokeWidth="0.8" />

          {/* Sweeping Laser Searchlights */}
          <path d="M 65 40 L 15 -30 L 30 -30 Z" fill="#F43F5E" opacity="0.25" />
          <path d="M 65 40 L 110 -30 L 125 -30 Z" fill="#06B6D4" opacity="0.25" />

          {/* Title Badge */}
          <rect
            x="12"
            y="74"
            width="112"
            height="18"
            rx="9"
            fill="#1E0E28"
            stroke="#EC4899"
            strokeWidth="0.8"
          />
          <text
            x="68"
            y="86"
            textAnchor="middle"
            fill="#FBCFE8"
            fontSize="8"
            fontWeight="bold"
          >
            بوليفارد سيتي • BOULEVARD CITY
          </text>
        </g>

        {/* ============================================================== */}
        {/* VIP LUXURY ARCHITECTURAL COMPASS ROSE (وردة الرياح الفاخرة)    */}
        {/* ============================================================== */}
        <g id="compassRose" transform="translate(860, 480)">
          {/* Compass Rings */}
          <circle cx="0" cy="0" r="42" fill="#060A14" stroke="#D97706" strokeWidth="1" opacity="0.8" />
          <circle cx="0" cy="0" r="36" fill="none" stroke="#F59E0B" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.7" />
          <circle cx="0" cy="0" r="26" fill="none" stroke="#FEF08A" strokeWidth="0.5" opacity="0.5" />

          {/* 8 Points of Compass */}
          {/* North Point (Gilded Amber) */}
          <polygon points="0,-36 5,-8 0,0" fill="#FEF08A" />
          <polygon points="0,-36 -5,-8 0,0" fill="#D97706" />
          {/* South Point */}
          <polygon points="0,36 -5,8 0,0" fill="#FEF08A" />
          <polygon points="0,36 5,8 0,0" fill="#D97706" />
          {/* East Point */}
          <polygon points="36,0 8,5 0,0" fill="#FEF08A" />
          <polygon points="36,0 8,-5 0,0" fill="#D97706" />
          {/* West Point */}
          <polygon points="-36,0 -8,-5 0,0" fill="#FEF08A" />
          <polygon points="-36,0 -8,5 0,0" fill="#D97706" />

          {/* Diagonal 4 Points */}
          <polygon points="22,-22 6,-2 0,0" fill="#B45309" opacity="0.7" />
          <polygon points="-22,-22 -2,-6 0,0" fill="#B45309" opacity="0.7" />
          <polygon points="22,22 2,6 0,0" fill="#B45309" opacity="0.7" />
          <polygon points="-22,22 -6,2 0,0" fill="#B45309" opacity="0.7" />

          {/* Central Jewel */}
          <circle cx="0" cy="0" r="3.5" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />

          {/* Arabic Cardinal Labels */}
          <text x="0" y="-40" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="black">
            ش
          </text>
          <text x="0" y="49" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="black">
            ج
          </text>
          <text x="46" y="3" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="black">
            ق
          </text>
          <text x="-46" y="3" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="black">
            غ
          </text>
        </g>

        {/* --- Cartographic GPS Coordinates & Scale Metadata --- */}
        <g id="mapCoordinates" transform="translate(180, 580)">
          <rect
            x="-10"
            y="-14"
            width="320"
            height="26"
            rx="6"
            fill="#030712"
            fillOpacity="0.8"
            stroke="#D97706"
            strokeWidth="0.6"
            strokeOpacity="0.6"
          />
          <text x="0" y="2" fill="#FDE68A" fontSize="8.5" fontWeight="bold" letterSpacing="1">
            24°42&apos;42&quot;N 46°40&apos;26&quot;E • METROPOLIS SCALE 1:10,000
          </text>
          <text x="215" y="2" fill="#38BDF8" fontSize="8" fontWeight="bold">
            العاصمة الفاخرة
          </text>
        </g>
      </svg>
    </div>
  );
}
