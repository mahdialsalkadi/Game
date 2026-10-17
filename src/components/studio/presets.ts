import { PRESET_PACKS, FAMOUS_GAME_PRESETS } from "@/game/aiPackGenerator";
import type { GeneratedSessionPack } from "@/game/schema";

export { PRESET_PACKS, FAMOUS_GAME_PRESETS };

export const CYBERPUNK_PRESET = PRESET_PACKS.CYBERPUNK_HEIST;
export const ANCIENT_SULTANATE_PRESET = PRESET_PACKS.ANCIENT_SULTANATE;
export const OFFICE_MAYHEM_PRESET = PRESET_PACKS.OFFICE_MAYHEM;

export const STUDIO_PRESETS: Record<string, { label: string; pack: GeneratedSessionPack; icon?: string }> = {
  MONOPOLY_CLASSIC: {
    label: "🎩 مونوبولي الكلاسيكية (شراء وإيجارات)",
    pack: PRESET_PACKS.MONOPOLY_CLASSIC,
    icon: "🎩"
  },
  WORLD_CONQUEST_RISK: {
    label: "⚔️ صراع الدول والفتوحات (احتلال الأقاليم)",
    pack: PRESET_PACKS.WORLD_CONQUEST_RISK,
    icon: "⚔️"
  },
  TACTICAL_CARDS_UNO: {
    label: "🃏 حرب الأوراق التكتيكية (تخلص من البطاقات)",
    pack: PRESET_PACKS.TACTICAL_CARDS_UNO,
    icon: "🃏"
  },
  SOCIAL_MAFIA_SPY: {
    label: "🕵️ مجلس الشك والمافيا (نقاش وتصويت علني)",
    pack: PRESET_PACKS.SOCIAL_MAFIA_SPY,
    icon: "🕵️"
  },
  SNAKES_AND_LADDERS_RPG: {
    label: "🪜 السلم والثعبان الأسطورية (قفزات وسباق)",
    pack: PRESET_PACKS.SNAKES_AND_LADDERS_RPG,
    icon: "🪜"
  },
  SULTANATE_MERCHANTS: {
    label: "🕌 تجار السلطنة والقوافل (عقارات ومضاربة)",
    pack: PRESET_PACKS.SULTANATE_MERCHANTS,
    icon: "🕌"
  },
  CYBERPUNK: {
    label: "⚡ سايبربانك نيون 2088 (سباق لوحة)",
    pack: PRESET_PACKS.CYBERPUNK_HEIST,
    icon: "⚡"
  },
  OFFICE_MAYHEM: {
    label: "☕ فوضى الدوام المكتبي (معارك بطاقات)",
    pack: PRESET_PACKS.OFFICE_MAYHEM,
    icon: "☕"
  }
};
