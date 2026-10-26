"use client";

import React from "react";

export interface WoodTabletopEnvironmentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "mahogany" | "walnut" | "darkOak";
  showPlanks?: boolean;
  showSpotlight?: boolean;
}

export default function WoodTabletopEnvironment({
  children,
  className = "",
  style = {},
  variant = "mahogany",
  showPlanks = true,
  showSpotlight = true
}: WoodTabletopEnvironmentProps) {
  // Color palette definitions based on wood species
  const woodStyles = {
    mahogany: {
      base: "from-[#2f150c] via-[#3d1c10] to-[#240e07]",
      borderColor: "border-[#4a2213]",
      grooveColor: "rgba(20, 8, 4, 0.75)",
      grooveHighlight: "rgba(255, 205, 160, 0.08)",
      plankColor1: "#34170d",
      plankColor2: "#3a1a0f",
      plankColor3: "#2c130b",
      plankColor4: "#421e12",
      spotlightColor: "rgba(251, 191, 36, 0.12)",
      spotlightCore: "rgba(254, 243, 199, 0.16)",
      feltUnderlay: "#1a0b06"
    },
    walnut: {
      base: "from-[#261a12] via-[#332218] to-[#1a110a]",
      borderColor: "border-[#3d2b1f]",
      grooveColor: "rgba(15, 10, 6, 0.8)",
      grooveHighlight: "rgba(240, 210, 180, 0.07)",
      plankColor1: "#2b1c13",
      plankColor2: "#302016",
      plankColor3: "#241710",
      plankColor4: "#362419",
      spotlightColor: "rgba(245, 158, 11, 0.10)",
      spotlightCore: "rgba(253, 230, 138, 0.14)",
      feltUnderlay: "#140d08"
    },
    darkOak: {
      base: "from-[#1e130b] via-[#2a1b10] to-[#140c06]",
      borderColor: "border-[#362315]",
      grooveColor: "rgba(10, 6, 3, 0.85)",
      grooveHighlight: "rgba(230, 190, 150, 0.06)",
      plankColor1: "#22150d",
      plankColor2: "#27180f",
      plankColor3: "#1c1109",
      plankColor4: "#2e1c12",
      spotlightColor: "rgba(217, 119, 6, 0.09)",
      spotlightCore: "rgba(252, 211, 77, 0.12)",
      feltUnderlay: "#0e0804"
    }
  }[variant];

  return (
    <div
      className={`relative w-full h-full min-h-full overflow-hidden select-none bg-gradient-to-br ${woodStyles.base} ${className}`}
      style={{
        boxShadow: "inset 0 0 120px rgba(0, 0, 0, 0.85)",
        contain: "paint",
        ...style
      }}
    >
      {/* 1. Hardware-Accelerated Zero-Overhead CSS Wood Grain Backdrop (No SVG feTurbulence for 120FPS on 4K) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.015) 0px,
              rgba(0,0,0,0.04) 2px,
              rgba(255,255,255,0.015) 4px,
              transparent 8px
            ),
            radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.45) 100%)
          `,
          contain: "strict"
        }}
      />

      {/* 2. Realistic Handcrafted Wood Planks with Beveled Seams */}
      {showPlanks && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-80">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="flex-1 w-full relative border-b"
              style={{
                borderColor: woodStyles.grooveColor,
                boxShadow: `0 1px 0 ${woodStyles.grooveHighlight}`
              }}
            >
              {/* Subtle natural plank tone variation */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor:
                    i % 4 === 0
                      ? woodStyles.plankColor1
                      : i % 4 === 1
                      ? woodStyles.plankColor2
                      : i % 4 === 2
                      ? woodStyles.plankColor3
                      : woodStyles.plankColor4,
                  opacity: 0.18
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 3. Warm Chandelier Spotlight Centered Overhead */}
      {showSpotlight && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{
            background: `radial-gradient(ellipse 72% 58% at 50% 46%, ${woodStyles.spotlightCore} 0%, ${woodStyles.spotlightColor} 40%, rgba(0,0,0,0) 80%)`,
            mixBlendMode: "screen"
          }}
        />
      )}

      {/* 4. Soft Ambient Dining/Living Room Warm Lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(254, 215, 170, 0.08) 0%, rgba(217, 119, 6, 0.02) 50%, rgba(0, 0, 0, 0.45) 100%)",
          mixBlendMode: "soft-light"
        }}
      />

      {/* 5. Deep Cinematic Vignette at the Table Edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 45%, rgba(18, 8, 4, 0.5) 75%, rgba(8, 3, 1, 0.94) 100%)"
        }}
      />

      {/* 6. Solid Wood Beveled Table Border Rim */}
      <div
        className="absolute inset-0 pointer-events-none rounded-none border-[6px]"
        style={{
          borderColor: "rgba(40, 18, 9, 0.8)",
          boxShadow:
            "inset 0 1px 2px rgba(255, 205, 150, 0.15), inset 0 0 40px rgba(0, 0, 0, 0.8)"
        }}
      />

      {/* 7. Natural Table Surface Contents (Dropping realistic shadows onto wood) */}
      <div className="relative z-10 w-full h-full flex flex-col">{children}</div>
    </div>
  );
}
