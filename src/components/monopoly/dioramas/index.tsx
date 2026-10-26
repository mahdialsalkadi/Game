import React from "react";
import ClassicAtlanticCityScene from "./ClassicAtlanticCityScene";
import RiyadhMetropolisScene from "./RiyadhMetropolisScene";
import CyberpunkCityScene from "./CyberpunkCityScene";
import DeepSpaceScene from "./DeepSpaceScene";
import MedievalKingdomScene from "./MedievalKingdomScene";

export {
  ClassicAtlanticCityScene,
  RiyadhMetropolisScene,
  CyberpunkCityScene,
  DeepSpaceScene,
  MedievalKingdomScene
};

export interface DioramaMetaConfig {
  themeKey: "CLASSIC" | "RIYADH" | "CYBERPUNK" | "SPACE" | "MEDIEVAL";
  title: string;
  badge: string;
  chestTitle: string;
  chestSub: string;
  chanceTitle: string;
  chanceSub: string;
  skyGradient: string;
  rollAnnouncement: string;
}

/**
 * Resolves the diorama metadata and active visual theme.
 * Strictly prevents Classic Monopoly from ever inheriting Riyadh assets.
 */
export function getDioramaMeta(
  currencySymbol = "$",
  themeId?: string,
  themeTitle?: string
): DioramaMetaConfig {
  const isClassic =
    currencySymbol === "$" ||
    themeId === "MONOPOLY_CLASSIC" ||
    themeTitle?.includes("Monopoly Classic") ||
    themeTitle?.includes("الكلاسيكية") ||
    themeTitle?.includes("أصلية") ||
    themeTitle?.includes("Original") ||
    themeTitle?.includes("أتلانتيك") ||
    themeTitle?.includes("Atlantic") ||
    themeTitle?.includes("Boardwalk");

  const isCyberpunk =
    themeId === "CYBERPUNK_NEON" ||
    themeTitle?.includes("سايبربانك") ||
    themeTitle?.includes("Cyberpunk");

  const isDeepSpace =
    themeId === "DEEP_SPACE" ||
    themeTitle?.includes("الفضاء") ||
    themeTitle?.includes("Space") ||
    themeTitle?.includes("المجرة");

  const isMedieval =
    themeId === "MEDIEVAL_FANTASY" ||
    themeTitle?.includes("الفرسان") ||
    themeTitle?.includes("تنانين") ||
    themeTitle?.includes("Medieval") ||
    themeTitle?.includes("القلاع");

  const isRiyadh =
    !isClassic &&
    !isCyberpunk &&
    !isDeepSpace &&
    !isMedieval &&
    (themeId === "RIYADH_VIP" ||
      themeId === "ARABIAN_MAJLIS" ||
      themeTitle?.includes("الرياض") ||
      themeTitle?.includes("العاصمة") ||
      themeTitle?.includes("نجد"));

  if (isClassic) {
    return {
      themeKey: "CLASSIC",
      title: "مونوبولي العالمية الأصلية • أتلانتيك سيتي 1935",
      badge: "Classic 🎩",
      chestTitle: "صندوق الحظ 🎁",
      chestSub: "COMMUNITY CHEST",
      chanceTitle: "بطاقات الفرصة ❓",
      chanceSub: "CHANCE DECK",
      skyGradient: "linear-gradient(180deg, #38bdf8 0%, #7dd3fc 30%, #bae6fd 65%, #f0f9ff 100%)",
      rollAnnouncement: "النرد يتدحرج على رقعة المونوبولي... 🎲"
    };
  }

  if (isCyberpunk) {
    return {
      themeKey: "CYBERPUNK",
      title: "سايبربانك 2088 • صراع النيون والمستقبل",
      badge: "CYBER ⚡",
      chestTitle: "خوادم البيانات 💾",
      chestSub: "DATA SERVERS",
      chanceTitle: "كروت الاختراق ⚡",
      chanceSub: "CYBER HACKS",
      skyGradient: "linear-gradient(180deg, #2e0854 0%, #1e1035 30%, #090918 70%, #030014 100%)",
      rollAnnouncement: "النرد المشفر يتدحرج في فضاء النيون... ⚡"
    };
  }

  if (isDeepSpace) {
    return {
      themeKey: "SPACE",
      title: "غزو المجرة • مستكشفو الفضاء السحيق",
      badge: "COSMOS 🚀",
      chestTitle: "مفاعلات الطاقة ⚛️",
      chestSub: "WARP REACTORS",
      chanceTitle: "استكشاف المدار 🛰️",
      chanceSub: "ORBIT CHANCE",
      skyGradient: "linear-gradient(180deg, #050b14 0%, #0b192c 40%, #1e3e62 80%, #000000 100%)",
      rollAnnouncement: "نرد الجاذبية يتدحرج بين الكواكب... 🚀"
    };
  }

  if (isMedieval) {
    return {
      themeKey: "MEDIEVAL",
      title: "عصر الفرسان • ملاحم القلاع والتنانين",
      badge: "REALMS ⚔️",
      chestTitle: "خزائن القلعة 🏰",
      chestSub: "CASTLE VAULT",
      chanceTitle: "فرمانات التاج 📜",
      chanceSub: "ROYAL DECREE",
      skyGradient: "linear-gradient(180deg, #451a03 0%, #78350f 30%, #b45309 60%, #1c1917 100%)",
      rollAnnouncement: "نرد الفرسان يتدحرج على دروع الحرب... ⚔️"
    };
  }

  if (isRiyadh) {
    return {
      themeKey: "RIYADH",
      title: "عاصمة الصفقات • الرياض الكبرى 3D",
      badge: "VIP 🇸🇦",
      chestTitle: "صندوق العاصمة 🏛️",
      chestSub: "COMMUNITY CHEST",
      chanceTitle: "فرص وتحديات ⚡",
      chanceSub: "CHANCE DECK",
      skyGradient: "linear-gradient(180deg, #7ec8f7 0%, #bde5fd 24%, #e9f5fd 55%, #dfede2 78%, #cfded3 100%)",
      rollAnnouncement: "النرد يتدحرج في سماء الرياض... 🎲"
    };
  }

  // Safe fallback for custom future maps that don't match Riyadh
  return {
    themeKey: "CLASSIC",
    title: themeTitle || "مونوبولي العالمية الأصلية 🎩",
    badge: "MOD 🎲",
    chestTitle: "صندوق الحظ 🎁",
    chestSub: "COMMUNITY CHEST",
    chanceTitle: "بطاقات الفرصة ❓",
    chanceSub: "CHANCE DECK",
    skyGradient: "linear-gradient(180deg, #38bdf8 0%, #7dd3fc 30%, #bae6fd 65%, #f0f9ff 100%)",
    rollAnnouncement: "النرد يتدحرج على اللوحة المخصصة... 🎲"
  };
}

/**
 * Universal Diorama Scene Renderer.
 * Mounts the exact vector scene matching the active game theme.
 */
export function DioramaSceneRenderer({
  themeKey
}: {
  themeKey: "CLASSIC" | "RIYADH" | "CYBERPUNK" | "SPACE" | "MEDIEVAL";
}) {
  switch (themeKey) {
    case "CLASSIC":
      return <ClassicAtlanticCityScene />;
    case "CYBERPUNK":
      return <CyberpunkCityScene />;
    case "SPACE":
      return <DeepSpaceScene />;
    case "MEDIEVAL":
      return <MedievalKingdomScene />;
    case "RIYADH":
    default:
      return <RiyadhMetropolisScene />;
  }
}
