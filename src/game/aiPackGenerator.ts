import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { GeneratedSessionPackSchema } from "./schema";
import type { GeneratedSessionPack, GameArchetype } from "./schema";
import type { PlayerBehavioralDNA } from "./behavioralDNA";
import { AUTHENTIC_LUDO_PACK } from "./ludoEngine";
import {
  AUTHENTIC_MONOPOLY_PACK,
  ORIGINAL_CLASSIC_MONOPOLY_PACK,
  RIYADH_VIP_MONOPOLY_PACK
} from "./monopolyEngine";
import {
  CONNECT_FOUR_PACK,
  CHECKERS_PACK,
  BINGO_PACK
} from "./classicGamePacks";

/**
 * 1. الأمر التوجيهي للنظام (System Prompt)
 */
export const BOARD_GAME_SYSTEM_PROMPT = `
أنت "كبير مصممي ألعاب الطاولة التفاعلية" (Lead Party Board Game Designer) وكاتب سيناريو كوميدي ساخر باللغة العربية.
مهمتك هي تحويل (موضوع السهرة + أسماء الأصدقاء + مواقفهم الشخصية) إلى حزمة لعبة طاولة متكاملة وموزونة رياضياً بصيغة JSON.

يجب أن تلتزم حرفياً بالقواعد الهندسية الخمس التالية:

=========================================
أولاً: هندسة مسار اللوحة (20 مربعاً بالضبط من index 0 إلى 19)
=========================================
1. التوزيع الإجباري لأنواع المربعات (Tile Quotas):
   - المربع رقم 0 (index: 0): يجب أن يكون دائماً من نوع "START" مع تأثير defaultEffect من نوع MODIFY_COINS بقيمة +100 للهدف SELF.
   - المربعا رقم 7 ورقم 15: يجب أن يكونا من نوع "GLOBAL_VOTE" (بدون defaultEffect).
   - 6 مربعات من نوع "RESOURCE": موزعة بانتظام، وتحتوي وجوباً على defaultEffect من نوع MODIFY_COINS بقيمة موجبة بين +45 و +85 للهدف SELF (إلا إذا كانت اللعبة تعتمد نظام الشراء والإيجار BUY_AND_RENT حيث تحمل سعراً price وإيجاراً rent).
   - 4 مربعات من نوع "HAZARD": موزعة بحيث لا يتجاور مربعان منها أبداً، وتحتوي وجوباً على defaultEffect إما MODIFY_COINS بقيمة سالبة بين -25 و -55 أو MOVE_STEPS بقيمة بين -2 و -4 للهدف SELF.
   - 4 مربعات من نوع "SECRET_CARD": لا تحتوي على defaultEffect.
   - 3 مربعات من نوع "DRAMA_EVENT": لا تحتوي على defaultEffect.

2. قاعدة عدم التكتل (Anti-Clumping Rule):
   - يمنع منعاً باتاً وضع مربعين من نفس النوع خلف بعضهما مباشرة.

=========================================
ثانياً: هندسة كومة البطاقات (18 بطاقة بالضبط في cardsDeck)
=========================================
1. الفئة الأولى: "SECRET_HAND" (عددها 6 بطاقات، المعرفات card_01 إلى card_06)
   - بطاقات تكتيكية يحتفظ بها اللاعب في هاتفه.
   - الأوامر المفضلة: STEAL_COINS (35-75)، SWAP_POSITIONS (0)، SKIP_TURN (1)، GRANT_SHIELD (1)، أو MOVE_STEPS (+3 إلى +5).
   - قاعدة الهدف: يُسمح باستخدام CHOSEN_PLAYER أو SELF أو RICHEST_PLAYER.

2. الفئة الثانية: "PUBLIC_DRAMA" (عددها 8 بطاقات، المعرفات card_07 إلى card_14)
   - أحداث علنية تُنفذ فوراً على الشاشة الرئيسية.
   - يُمنع تماماً استخدام CHOSEN_PLAYER أو VOTE_PENALTY!
   - استخدم فقط: SELF, RICHEST_PLAYER, POOREST_PLAYER, RANDOM_OTHER, ALL_OTHERS.
   - صمم 4 بطاقات منها بتأثير مزدوج.

3. الفئة الثالثة: "VOTE_CARD" (عددها 4 بطاقات، المعرفات card_15 إلى card_18)
   - بطاقات تصويت جماعي.
   - يبدأ نصها بسؤال تصويت مباشر ومضحك.
   - تحتوي على تأثير واحد فقط: VOTE_PENALTY مع ALL_OTHERS وقيمة سالبة (-50 إلى -90).

=========================================
ثالثاً: قواعد التخصيص والأسلوب اللغوي
=========================================
1. التوزيع العادل: اسم كل لاعب يظهر في بطاقتين على الأقل، ولا أكثر من 3.
2. منع التكرار: كل مربع وبطاقة يحمل فكرة مختلفة تماماً.
3. لغة عربية بيضاء حيوية وسريعة الفهم.
4. اسم المربع (2-3 كلمات)، عنوان البطاقة (أقل من 35 حرفاً)، نص البطاقة (أقصى 150 حرفاً).
`;

/**
 * 2. بناء رسالة المستخدم
 */
export interface RoomGenerationInput {
  players: { name: string; promptIdea?: string; dna?: PlayerBehavioralDNA }[];
  pastGroupLore?: string[];
}

export function buildUserPrompt(input: RoomGenerationInput): string {
  const namesList = input.players.map((p) => p.name).join("، ");
  const ideasList = input.players
    .filter((p) => p.promptIdea && p.promptIdea.trim().length > 0)
    .map((p) => `- اقترح (${p.name}): "${p.promptIdea}"`)
    .join("\n");

  const dnaList = input.players
    .filter((p) => p.dna)
    .map((p) => {
      const dna = p.dna!;
      return `- البصمة السلوكية للاعب (${p.name}): اللقب [${dna.archetypeTitle}] | هجوم: ${dna.aggressionScore}%، اقتصاد: ${dna.capitalistScore}%، تكتيك: ${dna.tacticalCardScore}%، دبلوماسية: ${dna.socialVoterScore}% (صمم له كروت ومربعات تعزز أسلوبه وتفجر منافسته!)`;
    })
    .join("\n");

  const loreSection =
    input.pastGroupLore && input.pastGroupLore.length > 0
      ? `\nتاريخ الشلة من الجلسات السابقة:\n${input.pastGroupLore.map((l) => `* ${l}`).join("\n")}`
      : "";

  return `
صمم حزمة جلسة جديدة كلياً لهؤلاء الأصدقاء:
- أسماء اللاعبين: [${namesList}]

- أفكارهم ومواقفهم:
${ideasList || "- لم يكتبوا ثيماً محدداً؛ ابتكر لهم ثيم سهرة كوميدي مفاجئ وادمج أسماءهم فيه!"}
${dnaList ? `\n- الملفات الشخصية السلوكية للذكاء الاصطناعي (AI DNA Profiles):\n${dnaList}` : ""}
${loreSection}

تأكد من فحص التوزيع الرقمي للمربعات الـ 20 والبطاقات الـ 18 قبل إخراج الـ JSON النهائي.
`;
}

/**
 * 3. طبقة الحماية البرمجية (Post-Processing Guard)
 */
export function sanitizeGeneratedPack(pack: GeneratedSessionPack): GeneratedSessionPack {
  if (!pack.rulesConfig) {
    pack.rulesConfig = {
      turnMechanism: "DICE_AND_MOVE",
      cardVisibility: "SECRET_PHONE_ONLY",
      ownershipSystem: "NONE"
    };
  }

  pack.tiles.forEach((tile, idx) => {
    tile.index = idx;
    if (idx === 0) {
      tile.tileType = "START";
      tile.defaultEffect = {
        actionType: "MODIFY_COINS",
        targetType: "SELF",
        value: 100
      };
    } else if (tile.tileType === "RESOURCE" && !tile.defaultEffect && !tile.price) {
      tile.defaultEffect = {
        actionType: "MODIFY_COINS",
        targetType: "SELF",
        value: 60
      };
    } else if (tile.tileType === "HAZARD" && !tile.defaultEffect) {
      tile.defaultEffect = {
        actionType: "MODIFY_COINS",
        targetType: "SELF",
        value: -40
      };
    }
  });

  pack.cardsDeck.forEach((card, idx) => {
    card.id = `card_${String(idx + 1).padStart(2, "0")}`;

    if (card.category === "PUBLIC_DRAMA") {
      card.effects.forEach((eff) => {
        if (eff.targetType === "CHOSEN_PLAYER") {
          eff.targetType = "RANDOM_OTHER";
        }
        if (eff.actionType === "VOTE_PENALTY") {
          eff.actionType = "MODIFY_COINS";
        }
      });
    }

    if (card.category === "VOTE_CARD") {
      card.effects = [
        {
          actionType: "VOTE_PENALTY",
          targetType: "ALL_OTHERS",
          value: -Math.abs(card.effects[0]?.value || 60)
        }
      ];
    }
  });

  return pack;
}

/**
 * 4. تعريفات وبيانات القوالب العالمية الستة (Famous Presets Metadata)
 */
export interface FamousGamePresetMeta {
  id: string;
  key: string;
  titleAr: string;
  taglineAr: string;
  icon: string;
  badge: string;
  turnMechanism: string;
  ownershipSystem: string;
  winCondition: string;
}

export const FAMOUS_GAME_PRESETS: FamousGamePresetMeta[] = [
  {
    id: "monopoly",
    key: "MONOPOLY_CLASSIC",
    titleAr: "مونوبولي كلاسيك الأصلية",
    taglineAr: "بوردووك وإلينوي وشراء العقارات الكلاسيكية بالدولار",
    icon: "Building2",
    badge: "شراء وإيجارات 🎩",
    turnMechanism: "DICE_AND_MOVE",
    ownershipSystem: "BUY_AND_RENT",
    winCondition: "MOST_COINS"
  },
  {
    id: "risk",
    key: "WORLD_CONQUEST_RISK",
    titleAr: "غزو العالم (ريسك)",
    taglineAr: "حروب أقاليم وجيوش واحتلال الخريطة بدون نرد",
    icon: "Swords",
    badge: "قيادة أقاليم",
    turnMechanism: "TERRITORY_COMMAND",
    ownershipSystem: "CONQUER_REGIONS",
    winCondition: "LAST_SURVIVOR"
  },
  {
    id: "uno",
    key: "TACTICAL_CARDS_UNO",
    titleAr: "تحدي الأوراق (أونو)",
    taglineAr: "رمي بطاقات تكتيكية وسرقة وتجميد أدوار سريعة",
    icon: "Layers",
    badge: "أوراق تكتيكية",
    turnMechanism: "CARD_PLAY_ONLY",
    ownershipSystem: "NONE",
    winCondition: "TARGET_SCORE"
  },
  {
    id: "mafia",
    key: "SOCIAL_MAFIA_SPY",
    titleAr: "المافيا والجاسوس",
    taglineAr: "سوالف وتحقيق وتصويت إقصائي علني على الهواتف",
    icon: "Users",
    badge: "تصويت وسوالف",
    turnMechanism: "SOCIAL_DISCUSSION_VOTE",
    ownershipSystem: "NONE",
    winCondition: "LAST_SURVIVOR"
  },
  {
    id: "snakes",
    key: "SNAKES_AND_LADDERS_RPG",
    titleAr: "السلم والثعبان الأسطوري",
    taglineAr: "سلالم صاعدة وثعابين غادرة وسباق إلى القمة",
    icon: "Flame",
    badge: "سلالم وثعابين",
    turnMechanism: "DICE_AND_MOVE",
    ownershipSystem: "NONE",
    winCondition: "FIRST_TO_FINISH"
  },
  {
    id: "sultanate",
    key: "SULTANATE_MERCHANTS",
    titleAr: "تجار السلطنة وبازار الحرير",
    taglineAr: "تجارة تاريخية وقوافل حرير وعقارات وبازارات",
    icon: "Coins",
    badge: "تجارة وبازار",
    turnMechanism: "DICE_AND_MOVE",
    ownershipSystem: "BUY_AND_RENT",
    winCondition: "MOST_COINS"
  },
  {
    id: "ludo",
    key: "LUDO_CLASSIC",
    titleAr: "لودو المجلس (Ludo Star)",
    taglineAr: "مسارات صليب كلاسيكية ونرد 6 وأكل قطع ونجوم أمان",
    icon: "Dices",
    badge: "لودو كلاسيك",
    turnMechanism: "DICE_AND_MOVE",
    ownershipSystem: "NONE",
    winCondition: "FIRST_TO_FINISH"
  }
];

/**
 * 5. مكتبة الحزم والقوالب الجاهزة بالكامل (PRESET_PACKS)
 */
export const PRESET_PACKS: Record<string, GeneratedSessionPack> = {
  "LUDO_CLASSIC": AUTHENTIC_LUDO_PACK,
  "MONOPOLY_CLASSIC": ORIGINAL_CLASSIC_MONOPOLY_PACK,
  "RIYADH_VIP": RIYADH_VIP_MONOPOLY_PACK,

  "WORLD_CONQUEST_RISK": {
    "themeTitle": "غزو العالم (حروب الأقاليم)",
    "visualStyle": "ANCIENT_ARABIA",
    "archetype": "BOARD_RACE",
    "winCondition": "LAST_SURVIVOR",
    "currencyName": "كتيبة",
    "narratorIntro": "قُد جيوشك لاحتلال الخريطة! اختر أقاليمك، عزز دفاعاتك، واجتح أراضي الخصوم بدون رحمة!",
    "rulesConfig": {
      "turnMechanism": "TERRITORY_COMMAND",
      "cardVisibility": "NO_HAND_CARDS",
      "ownershipSystem": "CONQUER_REGIONS"
    },
    "tiles": [
      {
        "index": 0,
        "tileType": "START",
        "name": "مقر القيادة العامة",
        "description": "حشد الكتائب وتجنيد 100 مقاتل جديد.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 100
        }
      },
      {
        "index": 1,
        "tileType": "RESOURCE",
        "name": "إقليم بلاد الشام",
        "description": "أرض خصبة وممر استراتيجي.",
        "price": 50,
        "armies": 1,
        "ownerId": null
      },
      {
        "index": 2,
        "tileType": "RESOURCE",
        "name": "إقليم بلاد الرافدين",
        "description": "حضارة النهرين ومخزن مؤن الجيوش.",
        "price": 50,
        "armies": 1,
        "ownerId": null
      },
      {
        "index": 3,
        "tileType": "HAZARD",
        "name": "صحراء النفوذ الوعرة",
        "description": "عاصفة رملية تعطل تموين الكتائب!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -35
        }
      },
      {
        "index": 4,
        "tileType": "RESOURCE",
        "name": "إقليم نجد العذية",
        "description": "قلب الجزيرة وحصون الصمود.",
        "price": 60,
        "armies": 2,
        "ownerId": null
      },
      {
        "index": 5,
        "tileType": "RESOURCE",
        "name": "مضيق هرمز الاستراتيجي",
        "description": "ممر الملاحة والسيطرة البحرية.",
        "price": 70,
        "armies": 2,
        "ownerId": null
      },
      {
        "index": 6,
        "tileType": "RESOURCE",
        "name": "إقليم الحجاز الشريف",
        "description": "مهبط الأبطال وموانئ البحر الأحمر.",
        "price": 60,
        "armies": 1,
        "ownerId": null
      },
      {
        "index": 7,
        "tileType": "GLOBAL_VOTE",
        "name": "مجلس الحرب والتحالفات",
        "description": "تصويت القادة على إدانة المعتدي وفرض هدنة قسرية!"
      },
      {
        "index": 8,
        "tileType": "RESOURCE",
        "name": "إقليم وادي النيل",
        "description": "عمق استراتيجي وقوة بشرية ضخمة.",
        "price": 70,
        "armies": 2,
        "ownerId": null
      },
      {
        "index": 9,
        "tileType": "RESOURCE",
        "name": "شبه جزيرة سيناء",
        "description": "معبر الفتوحات والبوابة الشرقية.",
        "price": 50,
        "armies": 1,
        "ownerId": null
      },
      {
        "index": 10,
        "tileType": "RESOURCE",
        "name": "مضيق باب المندب",
        "description": "بوابة المحيط الجنوبي والتجارة.",
        "price": 60,
        "armies": 1,
        "ownerId": null
      },
      {
        "index": 11,
        "tileType": "DRAMA_EVENT",
        "name": "تمرد عسكري مباغت",
        "description": "انشقاق بعض الفصائل يغير موازين القوى!"
      },
      {
        "index": 12,
        "tileType": "RESOURCE",
        "name": "إقليم برقة وطرابلس",
        "description": "سواحل الشمال الإفريقي وحصونه.",
        "price": 50,
        "armies": 1,
        "ownerId": null
      },
      {
        "index": 13,
        "tileType": "HAZARD",
        "name": "جبال طوروس الشاهقة",
        "description": "طرق جبلية وعرة تستنزف العتاد!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -40
        }
      },
      {
        "index": 14,
        "tileType": "RESOURCE",
        "name": "إقليم قرطاج التاريخي",
        "description": "قلاع الأسطول البحري القديم.",
        "price": 65,
        "armies": 2,
        "ownerId": null
      },
      {
        "index": 15,
        "tileType": "GLOBAL_VOTE",
        "name": "محكمة جرائم الحصار",
        "description": "استفتاء الجنود لمحاكمة القائد الغاشم!"
      },
      {
        "index": 16,
        "tileType": "RESOURCE",
        "name": "إقليم جبال الأطلس",
        "description": "حصون طبيعية تصعب استباحتها.",
        "price": 70,
        "armies": 2,
        "ownerId": null
      },
      {
        "index": 17,
        "tileType": "DRAMA_EVENT",
        "name": "إمدادات فرسان الصحراء",
        "description": "وصول خيالة لدعم الصفوف الأمامية!"
      },
      {
        "index": 18,
        "tileType": "RESOURCE",
        "name": "إقليم الأندلس الخضراء",
        "description": "قصور المجد والسيطرة القصوى.",
        "price": 80,
        "armies": 2,
        "ownerId": null
      },
      {
        "index": 19,
        "tileType": "SECRET_CARD",
        "name": "غرفة الخطط السرية",
        "description": "مقر الخرائط العسكرية والمناورات."
      }
    ],
    "cardsDeck": [
      {
        "id": "risk_01",
        "title": "هجوم الفرسان الخاطف",
        "category": "SECRET_HAND",
        "flavorText": "إغارة ليلية تسلب كتائب من معسكر العدو!",
        "effects": [
          {
            "actionType": "STEAL_COINS",
            "targetType": "CHOSEN_PLAYER",
            "value": 45
          }
        ]
      },
      {
        "id": "risk_02",
        "title": "نقل الجبهة العسكرية",
        "category": "SECRET_HAND",
        "flavorText": "مناورة التفافية تبدل موقع فيلقك مع خصمك!",
        "effects": [
          {
            "actionType": "SWAP_POSITIONS",
            "targetType": "CHOSEN_PLAYER",
            "value": 0
          }
        ]
      },
      {
        "id": "risk_03",
        "title": "حصار خطوط الإمداد",
        "category": "SECRET_HAND",
        "flavorText": "قطعت الإمدادات عن جيش الخصم وعطلت زحفه دوراً!",
        "effects": [
          {
            "actionType": "SKIP_TURN",
            "targetType": "CHOSEN_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "risk_04",
        "title": "تروس حديدية وحصن منيع",
        "category": "SECRET_HAND",
        "flavorText": "بناء استحكامات تحمي كتائبك من الهجوم القادم!",
        "effects": [
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "SELF",
            "value": 1
          }
        ]
      },
      {
        "id": "risk_05",
        "title": "زحف سريع",
        "category": "SECRET_HAND",
        "flavorText": "تقدم مباغت يجتاح الأراضي للأمام!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "SELF",
            "value": 4
          }
        ]
      },
      {
        "id": "risk_06",
        "title": "جزية الإمبراطورية العظمى",
        "category": "SECRET_HAND",
        "flavorText": "فرض ضريبة حرب على أكثر الجيوش عتاداً!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 25
          }
        ]
      },
      {
        "id": "risk_07",
        "title": "وباء في المعسكرات",
        "category": "PUBLIC_DRAMA",
        "flavorText": "مرض يصيب خيام الجنود ويقلص كتائب الخصوم!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "ALL_OTHERS",
            "value": -30
          }
        ]
      },
      {
        "id": "risk_08",
        "title": "تحالف الفئات المستضعفة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "دعم الكتائب المتعثرة بالعتاد والمؤن!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": -30
          },
          {
            "actionType": "MODIFY_COINS",
            "targetType": "POOREST_PLAYER",
            "value": 40
          }
        ]
      },
      {
        "id": "risk_09",
        "title": "اغتيال الجنرال الأكبر",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضربة قاصمة لقيادة الجيش الأقوى على الخريطة!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 20
          }
        ]
      },
      {
        "id": "risk_10",
        "title": "مرتزقة أجانب",
        "category": "PUBLIC_DRAMA",
        "flavorText": "انضمام فرقة مقاتلين أجانب لجيش محظوظ!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "RANDOM_OTHER",
            "value": 70
          }
        ]
      },
      {
        "id": "risk_11",
        "title": "انسحاب تكتيكي",
        "category": "PUBLIC_DRAMA",
        "flavorText": "تراجع فيلق عشوائي للخلف بسبب وعورة المسالك!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "RANDOM_OTHER",
            "value": -3
          }
        ]
      },
      {
        "id": "risk_12",
        "title": "معاهدة حماية الضعيف",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضريبة على الإمبراطورية الكبرى ودرع لأصغر فصيل!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 15
          },
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "POOREST_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "risk_13",
        "title": "غنائم الفتح المبين",
        "category": "PUBLIC_DRAMA",
        "flavorText": "استيلاء على خزائن الأسلحة وامتلاء صفوفك بالمقاتلين!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": 85
          }
        ]
      },
      {
        "id": "risk_14",
        "title": "قصف مدفعي شامل",
        "category": "PUBLIC_DRAMA",
        "flavorText": "نيران حرب تلتهم نسبة من كتائب جميع الجيوش!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "ALL_OTHERS",
            "value": 15
          }
        ]
      },
      {
        "id": "risk_15",
        "title": "استفتاء عزل الطاغية",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو القائد الأكثر عدوانية الذي يجب تجريد كتائبه؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -65
          }
        ]
      },
      {
        "id": "risk_16",
        "title": "كشف خيانة التحالف",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من نقض العهد العسكري وطعن حلفاءه في الظهر؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -70
          }
        ]
      },
      {
        "id": "risk_17",
        "title": "مجلس العقوبات الحربية",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو المستبد الذي يجب فرض حصار اقتصادي عليه؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -60
          }
        ]
      },
      {
        "id": "risk_18",
        "title": "محكمة التمرد والانشقاق",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يثير الفتنة بين الجيوش ويستحق الهزيمة الساحقة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -80
          }
        ]
      }
    ]
  },
  "TACTICAL_CARDS_UNO": {
    "themeTitle": "تحدي الأوراق السريع (أونو التكتيكي)",
    "visualStyle": "CYBERPUNK",
    "archetype": "DECK_BATTLER",
    "winCondition": "TARGET_SCORE",
    "targetScore": 350,
    "currencyName": "نقطة",
    "narratorIntro": "السرعة والتكتيك! العب أوراق السحب والسرقة وتخطي الأدوار واجمع 350 نقطة لتفوز!",
    "rulesConfig": {
      "turnMechanism": "CARD_PLAY_ONLY",
      "cardVisibility": "SECRET_PHONE_ONLY",
      "ownershipSystem": "NONE"
    },
    "tiles": [
      {
        "index": 0,
        "tileType": "START",
        "name": "ميدان التحدي",
        "description": "نقطة انطلاق السحب +100 نقطة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 100
        }
      },
      {
        "index": 1,
        "tileType": "RESOURCE",
        "name": "سحبة الورقة الذهبية",
        "description": "مكسب نقاط سريع.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 65
        }
      },
      {
        "index": 2,
        "tileType": "SECRET_CARD",
        "name": "كومة السحب السري",
        "description": "اسحب ورقة تكتيكية لهاتفك."
      },
      {
        "index": 3,
        "tileType": "HAZARD",
        "name": "فخ ورقة +4",
        "description": "عقوبة سحب إجباري!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -40
        }
      },
      {
        "index": 4,
        "tileType": "RESOURCE",
        "name": "بونس الألوان",
        "description": "تطابق لون بطاقتك يكسبك نقاطاً.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 70
        }
      },
      {
        "index": 5,
        "tileType": "DRAMA_EVENT",
        "name": "خلط الكومة العامة",
        "description": "إعادة توزيع أوراق الطاولة!"
      },
      {
        "index": 6,
        "tileType": "RESOURCE",
        "name": "مضاعف النقاط",
        "description": "ضربة نقاط مزدوجة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 75
        }
      },
      {
        "index": 7,
        "tileType": "GLOBAL_VOTE",
        "name": "تحدي كلمة أونو!",
        "description": "صوتوا على من نسي أن يقول أونو قبل أن يرمي ورقته!"
      },
      {
        "index": 8,
        "tileType": "SECRET_CARD",
        "name": "خزانة البطاقات النادرة",
        "description": "سحب بطاقة قلب الطاولة."
      },
      {
        "index": 9,
        "tileType": "HAZARD",
        "name": "تجميد الورقة الأخيرة",
        "description": "فقدان نقاط حاسم!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -45
        }
      },
      {
        "index": 10,
        "tileType": "RESOURCE",
        "name": "تسديدة الجوكر",
        "description": "كسب سريع للنقاط.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 60
        }
      },
      {
        "index": 11,
        "tileType": "DRAMA_EVENT",
        "name": "عكس اتجاه الطاولة 🔄",
        "description": "انعكاس مسار الأدوار!"
      },
      {
        "index": 12,
        "tileType": "SECRET_CARD",
        "name": "حزمة الأوراق الخاصة",
        "description": "بطاقة تكتيكية نادرة."
      },
      {
        "index": 13,
        "tileType": "HAZARD",
        "name": "غرامة التردد باللعب",
        "description": "تأخرت في رمي الورقة!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -35
        }
      },
      {
        "index": 14,
        "tileType": "RESOURCE",
        "name": "سلسلة البطاقات المتطابقة",
        "description": "مكافأة اللعب الذكي.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 80
        }
      },
      {
        "index": 15,
        "tileType": "GLOBAL_VOTE",
        "name": "استئناف اللعب الغشاش",
        "description": "تصويت على من أخفى أوراقه عن الأنظار!"
      },
      {
        "index": 16,
        "tileType": "DRAMA_EVENT",
        "name": "انفجار الألوان المشعة",
        "description": "حدث يقلب ترتيب النقاط!"
      },
      {
        "index": 17,
        "tileType": "HAZARD",
        "name": "بطاقة الحظر الصارم",
        "description": "خصم نقاط إجباري!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -50
        }
      },
      {
        "index": 18,
        "tileType": "RESOURCE",
        "name": "الورقة الرابحة الكبرى",
        "description": "أعلى مكسب نقاط على المسار.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 90
        }
      },
      {
        "index": 19,
        "tileType": "SECRET_CARD",
        "name": "الفرصة الحاسمة",
        "description": "اسحب ورقة الحسم الأخيرة!"
      }
    ],
    "cardsDeck": [
      {
        "id": "uno_01",
        "title": "سحب ورق إجباري (+2)",
        "category": "SECRET_HAND",
        "flavorText": "أجبرت صديقك على سحب أوراق وسرقت من نقاطه!",
        "effects": [
          {
            "actionType": "STEAL_COINS",
            "targetType": "CHOSEN_PLAYER",
            "value": 50
          }
        ]
      },
      {
        "id": "uno_02",
        "title": "تبديل الأيدي الكامل",
        "category": "SECRET_HAND",
        "flavorText": "بدلت موقعك وحالتك مع خصمك ببراعة!",
        "effects": [
          {
            "actionType": "SWAP_POSITIONS",
            "targetType": "CHOSEN_PLAYER",
            "value": 0
          }
        ]
      },
      {
        "id": "uno_03",
        "title": "تخطي الدور الصارم (Skip)",
        "category": "SECRET_HAND",
        "flavorText": "حرمت اللاعب التالي من دوره وحجرته!",
        "effects": [
          {
            "actionType": "SKIP_TURN",
            "targetType": "CHOSEN_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "uno_04",
        "title": "درع صد البطاقات (Block)",
        "category": "SECRET_HAND",
        "flavorText": "درع يحميك من أي بطاقة هجومية قادمة!",
        "effects": [
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "SELF",
            "value": 1
          }
        ]
      },
      {
        "id": "uno_05",
        "title": "قفزة البطاقة السريعة",
        "category": "SECRET_HAND",
        "flavorText": "تقدم خطوات نحو الفوز السريع!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "SELF",
            "value": 4
          }
        ]
      },
      {
        "id": "uno_06",
        "title": "ضريبة المتصدر",
        "category": "SECRET_HAND",
        "flavorText": "اقتطاع نقاط مباشرة من صاحب أعلى رصيد!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 25
          }
        ]
      },
      {
        "id": "uno_07",
        "title": "سحب جماعي (+4 للجميع)",
        "category": "PUBLIC_DRAMA",
        "flavorText": "قنبلة أوراق تنفجر وتخصم نقاطاً من جميع الخصوم!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "ALL_OTHERS",
            "value": -30
          }
        ]
      },
      {
        "id": "uno_08",
        "title": "هدية الورقة الإضافية",
        "category": "PUBLIC_DRAMA",
        "flavorText": "تبرعت بنقاط لدعم المتسابق المتعثر!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": -35
          },
          {
            "actionType": "MODIFY_COINS",
            "targetType": "POOREST_PLAYER",
            "value": 45
          }
        ]
      },
      {
        "id": "uno_09",
        "title": "احتراق أوراق المتصدر",
        "category": "PUBLIC_DRAMA",
        "flavorText": "المتصدر يتعثر ويخسر خمس رصيده فجأة!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 20
          }
        ]
      },
      {
        "id": "uno_10",
        "title": "سحبة الحظ العشوائية",
        "category": "PUBLIC_DRAMA",
        "flavorText": "لاعب عشوائي ينال نقاطاً إضافية ثمينة!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "RANDOM_OTHER",
            "value": 75
          }
        ]
      },
      {
        "id": "uno_11",
        "title": "تراجع إجباري في المسار",
        "category": "PUBLIC_DRAMA",
        "flavorText": "لاعب عشوائي يتراجع خطوات للخلف!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "RANDOM_OTHER",
            "value": -3
          }
        ]
      },
      {
        "id": "uno_12",
        "title": "توازن القوى التكتيكي",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضريبة على صاحب أعلى نقاط ودرع حماية للأضعف!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 15
          },
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "POOREST_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "uno_13",
        "title": "رمية أونو الصاعقة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "حركة بطاقات احترافية تمنحك 80 نقطة فورية!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": 80
          }
        ]
      },
      {
        "id": "uno_14",
        "title": "تصفية أوراق الطاولة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "خصم نقاط بنسبة 15% من جميع المنافسين!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "ALL_OTHERS",
            "value": 15
          }
        ]
      },
      {
        "id": "uno_15",
        "title": "محاكمة ناسي كلمة أونو",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من الذي بقي معه ورقة واحدة ولم ينبه الطاولة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -65
          }
        ]
      },
      {
        "id": "uno_16",
        "title": "اتهام بلعب ورقة خاطئة",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو اللاعب الذي غافل الجميع ولعب لوناً مخالفاً؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -70
          }
        ]
      },
      {
        "id": "uno_17",
        "title": "تصويت أسرع لاعب غشاش",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يسحب ورقتين ويدعي أنه سحب واحدة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -60
          }
        ]
      },
      {
        "id": "uno_18",
        "title": "عقوبة احتكار أوراق الجوكر",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يخبئ بطاقات +4 في كمه ويستحق الخسارة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -80
          }
        ]
      }
    ]
  },
  "SOCIAL_MAFIA_SPY": {
    "themeTitle": "جلسة المافيا والجاسوس (سوالف وتحقيق)",
    "visualStyle": "CARTOON_OFFICE",
    "archetype": "SOCIAL_DEDUCTION",
    "winCondition": "LAST_SURVIVOR",
    "currencyName": "صوت ثقة",
    "narratorIntro": "بيننا خائن مندس! تناقشوا بصوت عالٍ، حققوا مع المشتبه بهم، وصوتوا لإقصاء الجاسوس قبل أن يقضي عليكم!",
    "rulesConfig": {
      "turnMechanism": "SOCIAL_DISCUSSION_VOTE",
      "cardVisibility": "OPEN_PUBLIC_CARDS",
      "ownershipSystem": "NONE"
    },
    "tiles": [
      {
        "index": 0,
        "tileType": "START",
        "name": "دائرة التحقيق",
        "description": "منطقة الأمان وبدء الجولة +100 صوت ثقة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 100
        }
      },
      {
        "index": 1,
        "tileType": "RESOURCE",
        "name": "شهادة شاهد عيان",
        "description": "دليل يعزز ثقة الشلة بك.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 60
        }
      },
      {
        "index": 2,
        "tileType": "SECRET_CARD",
        "name": "ملف الأدلة السرية",
        "description": "اسحب وثيقة اتهام لهاتفك."
      },
      {
        "index": 3,
        "tileType": "HAZARD",
        "name": "زلة لسان محرجة",
        "description": "وقعت في فخ التناقض وفقدت ثقة الجميع!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -40
        }
      },
      {
        "index": 4,
        "tileType": "RESOURCE",
        "name": "حجة غياب قوية (Alibi)",
        "description": "أثبت براءتك واكتسبت أصوات ثقة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 70
        }
      },
      {
        "index": 5,
        "tileType": "DRAMA_EVENT",
        "name": "تسريب تسجيل صوتي 🎙️",
        "description": "فضيحة صوتية تهز الطاولة!"
      },
      {
        "index": 6,
        "tileType": "RESOURCE",
        "name": "تحليل لغة الجسد",
        "description": "كشفت ارتباك أحد الخصوم وربحت نقاطاً.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 65
        }
      },
      {
        "index": 7,
        "tileType": "GLOBAL_VOTE",
        "name": "جلسة الإعدام والتصويت",
        "description": "تصويت سري مباشر لإقصاء أكثر مشتبه به!"
      },
      {
        "index": 8,
        "tileType": "SECRET_CARD",
        "name": "تقرير المحقق الخاص",
        "description": "اسحب بطاقة كشف أسرار."
      },
      {
        "index": 9,
        "tileType": "HAZARD",
        "name": "شبهة تآمر ليلية",
        "description": "الأصابع تشير إليك بخسارة أصوات ثقة!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -45
        }
      },
      {
        "index": 10,
        "tileType": "RESOURCE",
        "name": "كشف مكيدة مدبرة",
        "description": "أفشلت مخطط المافيا واكتسبت هيبة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 75
        }
      },
      {
        "index": 11,
        "tileType": "DRAMA_EVENT",
        "name": "انقطاع مفاجئ للكهرباء 🕯️",
        "description": "فوضى عارمة واختفاء أدلة حاسمة!"
      },
      {
        "index": 12,
        "tileType": "SECRET_CARD",
        "name": "اعتراف مجهول المصدر",
        "description": "ورقة سرية تقلب موازين الاتهام."
      },
      {
        "index": 13,
        "tileType": "HAZARD",
        "name": "فحص جهاز كشف الكذب",
        "description": "نبضات قلبك المتسارعة أوقعتك في الشبهة!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -50
        }
      },
      {
        "index": 14,
        "tileType": "RESOURCE",
        "name": "إشادة رئيس التحقيق",
        "description": "مكافأة النزاهة والملاحظة الدقيقة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 80
        }
      },
      {
        "index": 15,
        "tileType": "GLOBAL_VOTE",
        "name": "محاكمة الجاسوس الكبرى",
        "description": "تصويت نهائي إقصائي على من تثبت خيانته!"
      },
      {
        "index": 16,
        "tileType": "DRAMA_EVENT",
        "name": "انقلاب الحليف الأقرب",
        "description": "صديقك المقرب يطعنك بتهمة غير متوقعة!"
      },
      {
        "index": 17,
        "tileType": "HAZARD",
        "name": "عزل انفرادي مؤقت",
        "description": "إبعادك عن المداولات وخسارة رصيد!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -40
        }
      },
      {
        "index": 18,
        "tileType": "RESOURCE",
        "name": "وسام الشرف والحقيقة",
        "description": "أعلى رصيد ثقة يُمنح لأذكى محقق.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 85
        }
      },
      {
        "index": 19,
        "tileType": "SECRET_CARD",
        "name": "الورقة الأخيرة للبراءة",
        "description": "فرصة أخيرة لقلب الطاولة قبل التصويت!"
      }
    ],
    "cardsDeck": [
      {
        "id": "maf_01",
        "title": "استجواب مباغت",
        "category": "SECRET_HAND",
        "flavorText": "أحرجت أحد اللاعبين بسؤال محكم وسلبت ثقته!",
        "effects": [
          {
            "actionType": "STEAL_COINS",
            "targetType": "CHOSEN_PLAYER",
            "value": 50
          }
        ]
      },
      {
        "id": "maf_02",
        "title": "تبادل قناع البراءة",
        "category": "SECRET_HAND",
        "flavorText": "رميت التهمة على صديقك وبدلت موقعك معه!",
        "effects": [
          {
            "actionType": "SWAP_POSITIONS",
            "targetType": "CHOSEN_PLAYER",
            "value": 0
          }
        ]
      },
      {
        "id": "maf_03",
        "title": "تكميم الأفواه",
        "category": "SECRET_HAND",
        "flavorText": "منعت مشتبهاً به من الكلام وتفويت دوره في النقاش!",
        "effects": [
          {
            "actionType": "SKIP_TURN",
            "targetType": "CHOSEN_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "maf_04",
        "title": "حصانة دبلوماسية",
        "category": "SECRET_HAND",
        "flavorText": "وثيقة حصانة ترد عنك أي تصويت أو اتهام!",
        "effects": [
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "SELF",
            "value": 1
          }
        ]
      },
      {
        "id": "maf_05",
        "title": "هروب من التحقيق",
        "category": "SECRET_HAND",
        "flavorText": "قفزت للأمام وتفاديت دائرة الشبهات!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "SELF",
            "value": 4
          }
        ]
      },
      {
        "id": "maf_06",
        "title": "تفتيش الحسابات السرية",
        "category": "SECRET_HAND",
        "flavorText": "كشفت ثروة أكثر شخص يتظاهر بالبراءة!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 25
          }
        ]
      },
      {
        "id": "maf_07",
        "title": "شبهة عامة على الجميع",
        "category": "PUBLIC_DRAMA",
        "flavorText": "أدلة غامضة تهز ثقة الطاولة بجميع المتواجدين!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "ALL_OTHERS",
            "value": -30
          }
        ]
      },
      {
        "id": "maf_08",
        "title": "حماية الضحية المستهدفة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضحيت بجزء من ثقتك لإنقاذ أكثر لاعب مظلوم!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": -35
          },
          {
            "actionType": "MODIFY_COINS",
            "targetType": "POOREST_PLAYER",
            "value": 45
          }
        ]
      },
      {
        "id": "maf_09",
        "title": "سقوط زعيم العصابة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "أكثر لاعب نفوذاً يتعرض لانهيار ثقة دراماتيكي!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 20
          }
        ]
      },
      {
        "id": "maf_10",
        "title": "براءة غير متوقعة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "أحد المشتبه بهم عشوائياً تثبت براءته الكاملة!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "RANDOM_OTHER",
            "value": 75
          }
        ]
      },
      {
        "id": "maf_11",
        "title": "تراجع مصداقية الشاهد",
        "category": "PUBLIC_DRAMA",
        "flavorText": "لاعب عشوائي يتلعثم ويتراجع للخلف!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "RANDOM_OTHER",
            "value": -3
          }
        ]
      },
      {
        "id": "maf_12",
        "title": "إنصاف المتهم البريء",
        "category": "PUBLIC_DRAMA",
        "flavorText": "خصم من صاحب أعلى أصوات ودعم للأقل رصيداً!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 15
          },
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "POOREST_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "maf_13",
        "title": "خطاب براءة تاريخي",
        "category": "PUBLIC_DRAMA",
        "flavorText": "كلماتك المقنعة أقنعت الحضور ومنحتك 85 صوت ثقة!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": 85
          }
        ]
      },
      {
        "id": "maf_14",
        "title": "تفتيش شامل للطاولة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "فحص وثائق يقتطع نسبة ثقة من جميع المنافسين!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "ALL_OTHERS",
            "value": 15
          }
        ]
      },
      {
        "id": "maf_15",
        "title": "تصويت طرد الجاسوس الأكبر",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو الجاسوس الأكثر مكراً الذي يجب إعدامه الليلة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -70
          }
        ]
      },
      {
        "id": "maf_16",
        "title": "لائحة الخيانة العظمى",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو الصديق الأقل ثقة الذي لا يؤتمن جانبه؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -75
          }
        ]
      },
      {
        "id": "maf_17",
        "title": "محاكمة الممثل البارع",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يتقن التمثيل والبكاء لتبرئة نفسه من التهم؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -60
          }
        ]
      },
      {
        "id": "maf_18",
        "title": "حكم الإقصاء النهائي",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو أخطر لاعب على الطاولة ويجب عزله فوراً؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -85
          }
        ]
      }
    ]
  },
  "SNAKES_AND_LADDERS_RPG": {
    "themeTitle": "السلم والثعبان الأسطوري (سباق الأبطال)",
    "visualStyle": "FANTASY",
    "archetype": "BOARD_RACE",
    "winCondition": "FIRST_TO_FINISH",
    "currencyName": "خطوة سحرية",
    "narratorIntro": "سباق نحو قمة البرج الأسطوري! تسلق السلالم الذهبية السريعة واحذر لدغات الثعابين العملاقة!",
    "rulesConfig": {
      "turnMechanism": "DICE_AND_MOVE",
      "cardVisibility": "NO_HAND_CARDS",
      "ownershipSystem": "NONE"
    },
    "tiles": [
      {
            "index": 0,
            "tileType": "START",
            "name": "بوابة الانطلاق (المربع 1)",
            "description": "بداية الرحلة والسباق نحو القمة! +100 خطوة سحرية.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 100
            }
      },
      {
            "index": 1,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #2",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 2,
            "tileType": "SECRET_CARD",
            "name": "لفافة الطيران #3",
            "description": "تعويذة سرية تدعم مسيرتك."
      },
      {
            "index": 3,
            "tileType": "RESOURCE",
            "name": "سلم الخيزران 🪜 (المربع 4)",
            "description": "اصعد فوراً إلى المربع #14!",
            "jumpToIndex": 13
      },
      {
            "index": 4,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #5",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 5,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #6",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 6,
            "tileType": "SECRET_CARD",
            "name": "صندوق الألغاز #7",
            "description": "بطاقة حظ غامضة تكافئك."
      },
      {
            "index": 7,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #8",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 8,
            "tileType": "RESOURCE",
            "name": "سلم الحبل المتين 🪜 (المربع 9)",
            "description": "اصعد فوراً إلى المربع #31!",
            "jumpToIndex": 30
      },
      {
            "index": 9,
            "tileType": "DRAMA_EVENT",
            "name": "زلزال الدرجات #10",
            "description": "اهتزاز في درجات السلم البرجي!"
      },
      {
            "index": 10,
            "tileType": "RESOURCE",
            "name": "واحة النسيم #11",
            "description": "راحة واستعادة طاقة وانتعاش.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 50
            }
      },
      {
            "index": 11,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #12",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 12,
            "tileType": "SECRET_CARD",
            "name": "لفافة الطيران #13",
            "description": "تعويذة سرية تدعم مسيرتك."
      },
      {
            "index": 13,
            "tileType": "HAZARD",
            "name": "مستنقع الوحل #14",
            "description": "طين لزج يعيق حركتك.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -30
            }
      },
      {
            "index": 14,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #15",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 15,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #16",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 16,
            "tileType": "HAZARD",
            "name": "ثعبان الحديقة 🐍 (المربع 17)",
            "description": "انزلق للخلف إلى المربع #7!",
            "jumpToIndex": 6,
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -25
            }
      },
      {
            "index": 17,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #18",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 18,
            "tileType": "SECRET_CARD",
            "name": "كهف الأسرار #19",
            "description": "كنز خفي ينتظر من يكتشفه."
      },
      {
            "index": 19,
            "tileType": "RESOURCE",
            "name": "سلم القلعة العتيق 🪜 (المربع 20)",
            "description": "اصعد فوراً إلى المربع #38!",
            "jumpToIndex": 37
      },
      {
            "index": 20,
            "tileType": "RESOURCE",
            "name": "واحة النسيم #21",
            "description": "راحة واستعادة طاقة وانتعاش.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 50
            }
      },
      {
            "index": 21,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #22",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 22,
            "tileType": "SECRET_CARD",
            "name": "لفافة الطيران #23",
            "description": "تعويذة سرية تدعم مسيرتك."
      },
      {
            "index": 23,
            "tileType": "HAZARD",
            "name": "مستنقع الوحل #24",
            "description": "طين لزج يعيق حركتك.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -30
            }
      },
      {
            "index": 24,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #25",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 25,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #26",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 26,
            "tileType": "SECRET_CARD",
            "name": "صندوق الألغاز #27",
            "description": "بطاقة حظ غامضة تكافئك."
      },
      {
            "index": 27,
            "tileType": "RESOURCE",
            "name": "سلم النجوم العملاق 🪜 (المربع 28)",
            "description": "قفزة أسطورية صاعدة إلى المربع #84!",
            "jumpToIndex": 83
      },
      {
            "index": 28,
            "tileType": "SECRET_CARD",
            "name": "كهف الأسرار #29",
            "description": "كنز خفي ينتظر من يكتشفه."
      },
      {
            "index": 29,
            "tileType": "DRAMA_EVENT",
            "name": "زلزال الدرجات #30",
            "description": "اهتزاز في درجات السلم البرجي!"
      },
      {
            "index": 30,
            "tileType": "RESOURCE",
            "name": "واحة النسيم #31",
            "description": "راحة واستعادة طاقة وانتعاش.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 50
            }
      },
      {
            "index": 31,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #32",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 32,
            "tileType": "SECRET_CARD",
            "name": "لفافة الطيران #33",
            "description": "تعويذة سرية تدعم مسيرتك."
      },
      {
            "index": 33,
            "tileType": "HAZARD",
            "name": "مستنقع الوحل #34",
            "description": "طين لزج يعيق حركتك.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -30
            }
      },
      {
            "index": 34,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #35",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 35,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #36",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 36,
            "tileType": "SECRET_CARD",
            "name": "صندوق الألغاز #37",
            "description": "بطاقة حظ غامضة تكافئك."
      },
      {
            "index": 37,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #38",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 38,
            "tileType": "SECRET_CARD",
            "name": "كهف الأسرار #39",
            "description": "كنز خفي ينتظر من يكتشفه."
      },
      {
            "index": 39,
            "tileType": "RESOURCE",
            "name": "سلم الجبل الوعر 🪜 (المربع 40)",
            "description": "اصعد فوراً إلى المربع #59!",
            "jumpToIndex": 58
      },
      {
            "index": 40,
            "tileType": "RESOURCE",
            "name": "واحة النسيم #41",
            "description": "راحة واستعادة طاقة وانتعاش.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 50
            }
      },
      {
            "index": 41,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #42",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 42,
            "tileType": "SECRET_CARD",
            "name": "لفافة الطيران #43",
            "description": "تعويذة سرية تدعم مسيرتك."
      },
      {
            "index": 43,
            "tileType": "HAZARD",
            "name": "مستنقع الوحل #44",
            "description": "طين لزج يعيق حركتك.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -30
            }
      },
      {
            "index": 44,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #45",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 45,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #46",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 46,
            "tileType": "SECRET_CARD",
            "name": "صندوق الألغاز #47",
            "description": "بطاقة حظ غامضة تكافئك."
      },
      {
            "index": 47,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #48",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 48,
            "tileType": "SECRET_CARD",
            "name": "كهف الأسرار #49",
            "description": "كنز خفي ينتظر من يكتشفه."
      },
      {
            "index": 49,
            "tileType": "DRAMA_EVENT",
            "name": "زلزال الدرجات #50",
            "description": "اهتزاز في درجات السلم البرجي!"
      },
      {
            "index": 50,
            "tileType": "RESOURCE",
            "name": "سلم البرج الرخامي 🪜 (المربع 51)",
            "description": "اصعد فوراً إلى المربع #67!",
            "jumpToIndex": 66
      },
      {
            "index": 51,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #52",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 52,
            "tileType": "SECRET_CARD",
            "name": "لفافة الطيران #53",
            "description": "تعويذة سرية تدعم مسيرتك."
      },
      {
            "index": 53,
            "tileType": "HAZARD",
            "name": "ثعبان الصخور الملتوي 🐍 (المربع 54)",
            "description": "انزلق للخلف إلى المربع #34!",
            "jumpToIndex": 33,
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -25
            }
      },
      {
            "index": 54,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #55",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 55,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #56",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 56,
            "tileType": "SECRET_CARD",
            "name": "صندوق الألغاز #57",
            "description": "بطاقة حظ غامضة تكافئك."
      },
      {
            "index": 57,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #58",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 58,
            "tileType": "SECRET_CARD",
            "name": "كهف الأسرار #59",
            "description": "كنز خفي ينتظر من يكتشفه."
      },
      {
            "index": 59,
            "tileType": "DRAMA_EVENT",
            "name": "زلزال الدرجات #60",
            "description": "اهتزاز في درجات السلم البرجي!"
      },
      {
            "index": 60,
            "tileType": "RESOURCE",
            "name": "واحة النسيم #61",
            "description": "راحة واستعادة طاقة وانتعاش.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 50
            }
      },
      {
            "index": 61,
            "tileType": "HAZARD",
            "name": "أفعى الوادي السحيق 🐍 (المربع 62)",
            "description": "سقوط حاد إلى المربع #19!",
            "jumpToIndex": 18,
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -25
            }
      },
      {
            "index": 62,
            "tileType": "RESOURCE",
            "name": "سلم السحاب الفضي 🪜 (المربع 63)",
            "description": "اصعد فوراً إلى المربع #81!",
            "jumpToIndex": 80
      },
      {
            "index": 63,
            "tileType": "HAZARD",
            "name": "ثعبان المستنقع 🐍 (المربع 64)",
            "description": "انزلق للخلف إلى المربع #60!",
            "jumpToIndex": 59,
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -25
            }
      },
      {
            "index": 64,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #65",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 65,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #66",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 66,
            "tileType": "SECRET_CARD",
            "name": "صندوق الألغاز #67",
            "description": "بطاقة حظ غامضة تكافئك."
      },
      {
            "index": 67,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #68",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 68,
            "tileType": "SECRET_CARD",
            "name": "كهف الأسرار #69",
            "description": "كنز خفي ينتظر من يكتشفه."
      },
      {
            "index": 69,
            "tileType": "DRAMA_EVENT",
            "name": "زلزال الدرجات #70",
            "description": "اهتزاز في درجات السلم البرجي!"
      },
      {
            "index": 70,
            "tileType": "RESOURCE",
            "name": "سلم قمة المجد 🪜 (المربع 71)",
            "description": "اصعد فوراً إلى المربع #91!",
            "jumpToIndex": 90
      },
      {
            "index": 71,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #72",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 72,
            "tileType": "SECRET_CARD",
            "name": "لفافة الطيران #73",
            "description": "تعويذة سرية تدعم مسيرتك."
      },
      {
            "index": 73,
            "tileType": "HAZARD",
            "name": "مستنقع الوحل #74",
            "description": "طين لزج يعيق حركتك.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -30
            }
      },
      {
            "index": 74,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #75",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 75,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #76",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 76,
            "tileType": "SECRET_CARD",
            "name": "صندوق الألغاز #77",
            "description": "بطاقة حظ غامضة تكافئك."
      },
      {
            "index": 77,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #78",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 78,
            "tileType": "SECRET_CARD",
            "name": "كهف الأسرار #79",
            "description": "كنز خفي ينتظر من يكتشفه."
      },
      {
            "index": 79,
            "tileType": "DRAMA_EVENT",
            "name": "زلزال الدرجات #80",
            "description": "اهتزاز في درجات السلم البرجي!"
      },
      {
            "index": 80,
            "tileType": "RESOURCE",
            "name": "واحة النسيم #81",
            "description": "راحة واستعادة طاقة وانتعاش.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 50
            }
      },
      {
            "index": 81,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #82",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 82,
            "tileType": "SECRET_CARD",
            "name": "لفافة الطيران #83",
            "description": "تعويذة سرية تدعم مسيرتك."
      },
      {
            "index": 83,
            "tileType": "HAZARD",
            "name": "مستنقع الوحل #84",
            "description": "طين لزج يعيق حركتك.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -30
            }
      },
      {
            "index": 84,
            "tileType": "RESOURCE",
            "name": "جرعة الحيوية #85",
            "description": "انتعاش ومكسب نقاط ثمين.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 70
            }
      },
      {
            "index": 85,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #86",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 86,
            "tileType": "HAZARD",
            "name": "ثعبان الصحراء الغادر 🐍 (المربع 87)",
            "description": "انهيار مروع إلى المربع #24!",
            "jumpToIndex": 23,
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -25
            }
      },
      {
            "index": 87,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #88",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 88,
            "tileType": "SECRET_CARD",
            "name": "كهف الأسرار #89",
            "description": "كنز خفي ينتظر من يكتشفه."
      },
      {
            "index": 89,
            "tileType": "DRAMA_EVENT",
            "name": "زلزال الدرجات #90",
            "description": "اهتزاز في درجات السلم البرجي!"
      },
      {
            "index": 90,
            "tileType": "RESOURCE",
            "name": "واحة النسيم #91",
            "description": "راحة واستعادة طاقة وانتعاش.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 50
            }
      },
      {
            "index": 91,
            "tileType": "RESOURCE",
            "name": "بلورة السرعة #92",
            "description": "طاقة سحرية تدفعك للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 60
            }
      },
      {
            "index": 92,
            "tileType": "HAZARD",
            "name": "أفعى الرياح الجبلية 🐍 (المربع 93)",
            "description": "انزلق للخلف إلى المربع #73!",
            "jumpToIndex": 72,
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -25
            }
      },
      {
            "index": 93,
            "tileType": "HAZARD",
            "name": "مستنقع الوحل #94",
            "description": "طين لزج يعيق حركتك.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -30
            }
      },
      {
            "index": 94,
            "tileType": "HAZARD",
            "name": "ثعبان الشفق الأحمر 🐍 (المربع 95)",
            "description": "انزلق للخلف إلى المربع #75!",
            "jumpToIndex": 74,
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -25
            }
      },
      {
            "index": 95,
            "tileType": "DRAMA_EVENT",
            "name": "رياح عاتية 🌪️ #96",
            "description": "رياح قوية تقلب توازن المتسابقين!"
      },
      {
            "index": 96,
            "tileType": "SECRET_CARD",
            "name": "صندوق الألغاز #97",
            "description": "بطاقة حظ غامضة تكافئك."
      },
      {
            "index": 97,
            "tileType": "RESOURCE",
            "name": "حذاء الريح #98",
            "description": "خطوات رشيقة للأمام.",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 55
            }
      },
      {
            "index": 98,
            "tileType": "HAZARD",
            "name": "الثعبان الأسطوري الكاسر 🐍 (المربع 99)",
            "description": "لدغة قبل خطوة من الفوز تسقطك إلى المربع #78!",
            "jumpToIndex": 77,
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": -25
            }
      },
      {
            "index": 99,
            "tileType": "RESOURCE",
            "name": "تاج القمة الذهبي (المربع 100) 👑",
            "description": "خط النهاية والمجد الأبدي! الفائز بالسباق!",
            "defaultEffect": {
                  "actionType": "MODIFY_COINS",
                  "targetType": "SELF",
                  "value": 150
            }
      }
],
    "cardsDeck": [
      {
        "id": "snk_01",
        "title": "سحب تعويذة السرعة",
        "category": "SECRET_HAND",
        "flavorText": "سلبت طاقة خطوات سحرية من منافسك!",
        "effects": [
          {
            "actionType": "STEAL_COINS",
            "targetType": "CHOSEN_PLAYER",
            "value": 50
          }
        ]
      },
      {
        "id": "snk_02",
        "title": "تبديل المدارج السحرية",
        "category": "SECRET_HAND",
        "flavorText": "بدلت موقعك على الدرج مع من يسبقك!",
        "effects": [
          {
            "actionType": "SWAP_POSITIONS",
            "targetType": "CHOSEN_PLAYER",
            "value": 0
          }
        ]
      },
      {
        "id": "snk_03",
        "title": "شباك العنكبوت المعيقة",
        "category": "SECRET_HAND",
        "flavorText": "أوقفت حركة الخصم لدور كامل في مكانه!",
        "effects": [
          {
            "actionType": "SKIP_TURN",
            "targetType": "CHOSEN_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "snk_04",
        "title": "درع صد سم الثعابين",
        "category": "SECRET_HAND",
        "flavorText": "درع يصد عنك لدغات الثعابين وفخاخ الطريق!",
        "effects": [
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "SELF",
            "value": 1
          }
        ]
      },
      {
        "id": "snk_05",
        "title": "وثبة الفهد السحري",
        "category": "SECRET_HAND",
        "flavorText": "قفزت 4 خطوات مباشرة للأمام!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "SELF",
            "value": 4
          }
        ]
      },
      {
        "id": "snk_06",
        "title": "جاذبية المتصدر",
        "category": "SECRET_HAND",
        "flavorText": "تجريد متصدر السباق من جزء من طاقته!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 25
          }
        ]
      },
      {
        "id": "snk_07",
        "title": "عاصفة السلالم العامة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "رياح شديدة تخصم خطوات من جميع المتسابقين!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "ALL_OTHERS",
            "value": -30
          }
        ]
      },
      {
        "id": "snk_08",
        "title": "يد العون للعداء المتأخر",
        "category": "PUBLIC_DRAMA",
        "flavorText": "دفعة طاقة سحرية لآخر المتسابقين للعودة للسباق!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": -30
          },
          {
            "actionType": "MODIFY_COINS",
            "targetType": "POOREST_PLAYER",
            "value": 40
          }
        ]
      },
      {
        "id": "snk_09",
        "title": "تعثر العداء الأول",
        "category": "PUBLIC_DRAMA",
        "flavorText": "المتصدر يتعثر بصخرة ويفقد خمس خطواته!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 20
          }
        ]
      },
      {
        "id": "snk_10",
        "title": "بساط الريح المفاجئ",
        "category": "PUBLIC_DRAMA",
        "flavorText": "لاعب عشوائي يحظى بجرعة خطوات كبرى!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "RANDOM_OTHER",
            "value": 75
          }
        ]
      },
      {
        "id": "snk_11",
        "title": "انزلاق على الصخور",
        "category": "PUBLIC_DRAMA",
        "flavorText": "لاعب عشوائي ينزلق ويتراجع خطوات للخلف!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "RANDOM_OTHER",
            "value": -3
          }
        ]
      },
      {
        "id": "snk_12",
        "title": "توازن حلبة السباق",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضريبة على الأول ودرع حماية لصاحب المركز الأخير!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 15
          },
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "POOREST_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "snk_13",
        "title": "أجنحة الصقر الذهبي",
        "category": "PUBLIC_DRAMA",
        "flavorText": "طيران حر يكسبك 80 خطوة وطاقة هائلة!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": 80
          }
        ]
      },
      {
        "id": "snk_14",
        "title": "انهيار جليدي جزئي",
        "category": "PUBLIC_DRAMA",
        "flavorText": "صقيع يقتطع نسبة طاقة من جميع المنافسين!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "ALL_OTHERS",
            "value": 15
          }
        ]
      },
      {
        "id": "snk_15",
        "title": "محاكمة دافع الخصوم",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو المتسابق الذي يمارس الخشونة لإسقاط البقية؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -65
          }
        ]
      },
      {
        "id": "snk_16",
        "title": "عقوبة استخدام ممرات ممنوعة",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو العداء المخادع الذي يختصر المسارات خفية؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -70
          }
        ]
      },
      {
        "id": "snk_17",
        "title": "استفتاء سحب الأقدام",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو أكسل متسابق يستحق عقوبة التراجع؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -60
          }
        ]
      },
      {
        "id": "snk_18",
        "title": "طرد المخربين من البرج",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو أكثر شخص يستفز الطاولة ويستحق العقاب الأقسى؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -80
          }
        ]
      }
    ]
  },
  "SULTANATE_MERCHANTS": {
    "themeTitle": "تجار السلطنة وبازار الحرير",
    "visualStyle": "ANCIENT_ARABIA",
    "archetype": "PARTY_ECONOMY",
    "winCondition": "MOST_COINS",
    "currencyName": "دينار ذهبي",
    "narratorIntro": "أهلاً بأسياد القوافل في قصر الخلافة! خزائن الذهب مشرعة، اشترِ الخانات والأسواق واجمع الدنانير!",
    "rulesConfig": {
      "turnMechanism": "DICE_AND_MOVE",
      "cardVisibility": "SECRET_PHONE_ONLY",
      "ownershipSystem": "BUY_AND_RENT"
    },
    "tiles": [
      {
        "index": 0,
        "tileType": "START",
        "name": "بوابة دمشق الكبرى",
        "description": "مرور القوافل المحملة بالحرير والتوابل يكسبك 100 دينار ذهبي.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 100
        }
      },
      {
        "index": 1,
        "tileType": "RESOURCE",
        "name": "سوق الحرير العتيق",
        "description": "دكاكين أقمشة فاخرة.",
        "price": 100,
        "rent": 25,
        "ownerId": null
      },
      {
        "index": 2,
        "tileType": "SECRET_CARD",
        "name": "خيمة المنجم",
        "description": "استشر عرّاف القصر واسحب حكمة سرية."
      },
      {
        "index": 3,
        "tileType": "RESOURCE",
        "name": "خان البهارات والتوابل",
        "description": "تجارة بهارات الهند والسند.",
        "price": 120,
        "rent": 30,
        "ownerId": null
      },
      {
        "index": 4,
        "tileType": "HAZARD",
        "name": "قطاع الطرق واللصوص",
        "description": "كمين لصوص الصحراء يسلب دنانيرك!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -35
        }
      },
      {
        "index": 5,
        "tileType": "RESOURCE",
        "name": "ميناء البصرة التجاري ⛵",
        "description": "مرسى السفن التجارية العملاقة.",
        "price": 180,
        "rent": 45,
        "ownerId": null
      },
      {
        "index": 6,
        "tileType": "RESOURCE",
        "name": "سوق العطور والعنبر",
        "description": "عطور ملكية ودهن عود خالص.",
        "price": 200,
        "rent": 50,
        "ownerId": null
      },
      {
        "index": 7,
        "tileType": "GLOBAL_VOTE",
        "name": "مجلس ديوان المظالم",
        "description": "محاسبة التجار المحتكرين والتصويت على تغريمهم!"
      },
      {
        "index": 8,
        "tileType": "RESOURCE",
        "name": "سوق صاغة الذهب",
        "description": "سبائك ذهبية وحلي تاريخية.",
        "price": 240,
        "rent": 60,
        "ownerId": null
      },
      {
        "index": 9,
        "tileType": "RESOURCE",
        "name": "قيسارية الأقمشة والكتان",
        "description": "سوق ملكي مسقوف للتجار الكبار.",
        "price": 260,
        "rent": 65,
        "ownerId": null
      },
      {
        "index": 10,
        "tileType": "RESOURCE",
        "name": "ميناء الإسكندرية والفنار 🏛️",
        "description": "بوابة التجارة مع بحر الروم.",
        "price": 180,
        "rent": 45,
        "ownerId": null
      },
      {
        "index": 11,
        "tileType": "DRAMA_EVENT",
        "name": "وصول أسطول السند",
        "description": "أرباح تجارية مضاعفة في الأسواق!"
      },
      {
        "index": 12,
        "tileType": "RESOURCE",
        "name": "بستان النخيل والتمور",
        "description": "تمور فاخرة مطلوبة في سائر الأمصار.",
        "price": 300,
        "rent": 75,
        "ownerId": null
      },
      {
        "index": 13,
        "tileType": "HAZARD",
        "name": "مكوس الحراس والضرائب",
        "description": "ضريبة مرور على بوابات المدن!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -50
        }
      },
      {
        "index": 14,
        "tileType": "RESOURCE",
        "name": "سوق الخيول العربية الأصيلة",
        "description": "جياد أصيلة لأمراء القصور.",
        "price": 320,
        "rent": 80,
        "ownerId": null
      },
      {
        "index": 15,
        "tileType": "GLOBAL_VOTE",
        "name": "شورى التجار الكبرى",
        "description": "تصويت أعيان السلطنة لمعاقبة التاجر المغرور!"
      },
      {
        "index": 16,
        "tileType": "RESOURCE",
        "name": "قصر الخلافة ومجلس السلطان",
        "description": "أعلى إيجار وأرفع مكانة في البلاد.",
        "price": 350,
        "rent": 90,
        "ownerId": null
      },
      {
        "index": 17,
        "tileType": "DRAMA_EVENT",
        "name": "عرس ولي العهد والأعطيات",
        "description": "توزيع دنانير ذهبية على الرعية!"
      },
      {
        "index": 18,
        "tileType": "RESOURCE",
        "name": "خزانة كنوز الأجداد 💎",
        "description": "جوهرة السلطنة وأعظم العقارات.",
        "price": 380,
        "rent": 95,
        "ownerId": null
      },
      {
        "index": 19,
        "tileType": "SECRET_CARD",
        "name": "الممر السري للبستان",
        "description": "اسحب فرماناً سلطانيا نادراً!"
      }
    ],
    "cardsDeck": [
      {
        "id": "sul_01",
        "title": "نشل أسواق بغداد",
        "category": "SECRET_HAND",
        "flavorText": "حركة خفيفة من شاطر محترف سرقت صرة دنانير من تاجر غافل!",
        "effects": [
          {
            "actionType": "STEAL_COINS",
            "targetType": "CHOSEN_PLAYER",
            "value": 55
          }
        ]
      },
      {
        "id": "sul_02",
        "title": "خاتم السلطان المزور",
        "category": "SECRET_HAND",
        "flavorText": "استخدمت ختماً مقلداً لتبديل مكانتك وقافلتك مع تاجر آخر!",
        "effects": [
          {
            "actionType": "SWAP_POSITIONS",
            "targetType": "CHOSEN_PLAYER",
            "value": 0
          }
        ]
      },
      {
        "id": "sul_03",
        "title": "توقيف الحراس للتفتيش",
        "category": "SECRET_HAND",
        "flavorText": "أمرت الحرس السلطاني باحتجاز خصمك وتفويت دوره!",
        "effects": [
          {
            "actionType": "SKIP_TURN",
            "targetType": "CHOSEN_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "sul_04",
        "title": "فرمان الأمان الإمبراطوري",
        "category": "SECRET_HAND",
        "flavorText": "مرسوم يحميك من أي دسائس أو غرامات موجهة ضدك!",
        "effects": [
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "SELF",
            "value": 1
          }
        ]
      },
      {
        "id": "sul_05",
        "title": "خيل عربية أصيلة",
        "category": "SECRET_HAND",
        "flavorText": "امتطيت جواداً سريعاً وقطعت أشواطاً متقدماً على الجميع!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "SELF",
            "value": 4
          }
        ]
      },
      {
        "id": "sul_06",
        "title": "زكاة التجار الكبار",
        "category": "SECRET_HAND",
        "flavorText": "أمرت بجمع زكاة الأموال من أغنى تاجر في المجلس فوراً!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 25
          }
        ]
      },
      {
        "id": "sul_07",
        "title": "قحط ومجاعة عابرة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "موجة جفاف رفعت أسعار المؤن وتسببت في خسارة مالية لجميع المنافسين!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "ALL_OTHERS",
            "value": -30
          }
        ]
      },
      {
        "id": "sul_08",
        "title": "صدقة الأمير السري",
        "category": "PUBLIC_DRAMA",
        "flavorText": "وهبت جزءاً من أموالك إحساناً لأفقر التجار في المجلس!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": -40
          },
          {
            "actionType": "MODIFY_COINS",
            "targetType": "POOREST_PLAYER",
            "value": 40
          }
        ]
      },
      {
        "id": "sul_09",
        "title": "غرق سفينة التوابل",
        "category": "PUBLIC_DRAMA",
        "flavorText": "عاصفة بحرية تغرق بضائع التاجر الأثرى في المجلس!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 20
          }
        ]
      },
      {
        "id": "sul_10",
        "title": "منحة الوالي للأشراف",
        "category": "PUBLIC_DRAMA",
        "flavorText": "صرة دنانير ذهبية تمنح لأحد التجار عشوائياً!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "RANDOM_OTHER",
            "value": 75
          }
        ]
      },
      {
        "id": "sul_11",
        "title": "تراجع القافلة للتزود",
        "category": "PUBLIC_DRAMA",
        "flavorText": "تاجر عشوائي يعود للواحة السابقة للتزود بالماء!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "RANDOM_OTHER",
            "value": -3
          }
        ]
      },
      {
        "id": "sul_12",
        "title": "حلف الفضول للعدالة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضريبة على الثري المتغطرس ودرع أمان للتاجر المبتدئ!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 15
          },
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "POOREST_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "sul_13",
        "title": "ربح صفقة العنبر الكبرى",
        "category": "PUBLIC_DRAMA",
        "flavorText": "بيعة تاريخية تملأ صناديقك بـ 85 ديناراً ذهبياً!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": 85
          }
        ]
      },
      {
        "id": "sul_14",
        "title": "عشور التجارة العامة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "مكوس إجبارية تقتطع نسبة دنانير من جميع المنافسين!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "ALL_OTHERS",
            "value": 15
          }
        ]
      },
      {
        "id": "sul_15",
        "title": "محاكمة غشاش الموازين",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو التاجر الذي يتلاعب بالميزان ويستحق غرامة المحتسب؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -65
          }
        ]
      },
      {
        "id": "sul_16",
        "title": "فتوى احتكار الأقوات",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يخفي البضائع لرفع الأسعار ويستحق العقوبة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -70
          }
        ]
      },
      {
        "id": "sul_17",
        "title": "استفتاء التباهي بالثروة",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو الأكثر تفاخراً بدنانيره ويستحق مصادرة جزء منها؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -60
          }
        ]
      },
      {
        "id": "sul_18",
        "title": "ديوان رد المظالم النهائي",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من الذي أضر ببقية التجار أكثر من غيره هذه الجولة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -80
          }
        ]
      }
    ]
  },
  "CYBERPUNK_HEIST": {
    "themeTitle": "سرقة القرن السيبرانية",
    "visualStyle": "CYBERPUNK",
    "archetype": "DECK_BATTLER",
    "winCondition": "TARGET_SCORE",
    "targetScore": 400,
    "currencyName": "بت كوين",
    "narratorIntro": "السرعة والتكتيك! العب أوراق السحب والسرقة وتخطي الأدوار واجمع 350 نقطة لتفوز!",
    "rulesConfig": {
      "turnMechanism": "CARD_PLAY_ONLY",
      "cardVisibility": "SECRET_PHONE_ONLY",
      "ownershipSystem": "NONE"
    },
    "tiles": [
      {
        "index": 0,
        "tileType": "START",
        "name": "ميدان التحدي",
        "description": "نقطة انطلاق السحب +100 نقطة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 100
        }
      },
      {
        "index": 1,
        "tileType": "RESOURCE",
        "name": "سحبة الورقة الذهبية",
        "description": "مكسب نقاط سريع.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 65
        }
      },
      {
        "index": 2,
        "tileType": "SECRET_CARD",
        "name": "كومة السحب السري",
        "description": "اسحب ورقة تكتيكية لهاتفك."
      },
      {
        "index": 3,
        "tileType": "HAZARD",
        "name": "فخ ورقة +4",
        "description": "عقوبة سحب إجباري!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -40
        }
      },
      {
        "index": 4,
        "tileType": "RESOURCE",
        "name": "بونس الألوان",
        "description": "تطابق لون بطاقتك يكسبك نقاطاً.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 70
        }
      },
      {
        "index": 5,
        "tileType": "DRAMA_EVENT",
        "name": "خلط الكومة العامة",
        "description": "إعادة توزيع أوراق الطاولة!"
      },
      {
        "index": 6,
        "tileType": "RESOURCE",
        "name": "مضاعف النقاط",
        "description": "ضربة نقاط مزدوجة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 75
        }
      },
      {
        "index": 7,
        "tileType": "GLOBAL_VOTE",
        "name": "تحدي كلمة أونو!",
        "description": "صوتوا على من نسي أن يقول أونو قبل أن يرمي ورقته!"
      },
      {
        "index": 8,
        "tileType": "SECRET_CARD",
        "name": "خزانة البطاقات النادرة",
        "description": "سحب بطاقة قلب الطاولة."
      },
      {
        "index": 9,
        "tileType": "HAZARD",
        "name": "تجميد الورقة الأخيرة",
        "description": "فقدان نقاط حاسم!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -45
        }
      },
      {
        "index": 10,
        "tileType": "RESOURCE",
        "name": "تسديدة الجوكر",
        "description": "كسب سريع للنقاط.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 60
        }
      },
      {
        "index": 11,
        "tileType": "DRAMA_EVENT",
        "name": "عكس اتجاه الطاولة 🔄",
        "description": "انعكاس مسار الأدوار!"
      },
      {
        "index": 12,
        "tileType": "SECRET_CARD",
        "name": "حزمة الأوراق الخاصة",
        "description": "بطاقة تكتيكية نادرة."
      },
      {
        "index": 13,
        "tileType": "HAZARD",
        "name": "غرامة التردد باللعب",
        "description": "تأخرت في رمي الورقة!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -35
        }
      },
      {
        "index": 14,
        "tileType": "RESOURCE",
        "name": "سلسلة البطاقات المتطابقة",
        "description": "مكافأة اللعب الذكي.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 80
        }
      },
      {
        "index": 15,
        "tileType": "GLOBAL_VOTE",
        "name": "استئناف اللعب الغشاش",
        "description": "تصويت على من أخفى أوراقه عن الأنظار!"
      },
      {
        "index": 16,
        "tileType": "DRAMA_EVENT",
        "name": "انفجار الألوان المشعة",
        "description": "حدث يقلب ترتيب النقاط!"
      },
      {
        "index": 17,
        "tileType": "HAZARD",
        "name": "بطاقة الحظر الصارم",
        "description": "خصم نقاط إجباري!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -50
        }
      },
      {
        "index": 18,
        "tileType": "RESOURCE",
        "name": "الورقة الرابحة الكبرى",
        "description": "أعلى مكسب نقاط على المسار.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 90
        }
      },
      {
        "index": 19,
        "tileType": "SECRET_CARD",
        "name": "الفرصة الحاسمة",
        "description": "اسحب ورقة الحسم الأخيرة!"
      }
    ],
    "cardsDeck": [
      {
        "id": "uno_01",
        "title": "سحب ورق إجباري (+2)",
        "category": "SECRET_HAND",
        "flavorText": "أجبرت صديقك على سحب أوراق وسرقت من نقاطه!",
        "effects": [
          {
            "actionType": "STEAL_COINS",
            "targetType": "CHOSEN_PLAYER",
            "value": 50
          }
        ]
      },
      {
        "id": "uno_02",
        "title": "تبديل الأيدي الكامل",
        "category": "SECRET_HAND",
        "flavorText": "بدلت موقعك وحالتك مع خصمك ببراعة!",
        "effects": [
          {
            "actionType": "SWAP_POSITIONS",
            "targetType": "CHOSEN_PLAYER",
            "value": 0
          }
        ]
      },
      {
        "id": "uno_03",
        "title": "تخطي الدور الصارم (Skip)",
        "category": "SECRET_HAND",
        "flavorText": "حرمت اللاعب التالي من دوره وحجرته!",
        "effects": [
          {
            "actionType": "SKIP_TURN",
            "targetType": "CHOSEN_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "uno_04",
        "title": "درع صد البطاقات (Block)",
        "category": "SECRET_HAND",
        "flavorText": "درع يحميك من أي بطاقة هجومية قادمة!",
        "effects": [
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "SELF",
            "value": 1
          }
        ]
      },
      {
        "id": "uno_05",
        "title": "قفزة البطاقة السريعة",
        "category": "SECRET_HAND",
        "flavorText": "تقدم خطوات نحو الفوز السريع!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "SELF",
            "value": 4
          }
        ]
      },
      {
        "id": "uno_06",
        "title": "ضريبة المتصدر",
        "category": "SECRET_HAND",
        "flavorText": "اقتطاع نقاط مباشرة من صاحب أعلى رصيد!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 25
          }
        ]
      },
      {
        "id": "uno_07",
        "title": "سحب جماعي (+4 للجميع)",
        "category": "PUBLIC_DRAMA",
        "flavorText": "قنبلة أوراق تنفجر وتخصم نقاطاً من جميع الخصوم!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "ALL_OTHERS",
            "value": -30
          }
        ]
      },
      {
        "id": "uno_08",
        "title": "هدية الورقة الإضافية",
        "category": "PUBLIC_DRAMA",
        "flavorText": "تبرعت بنقاط لدعم المتسابق المتعثر!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": -35
          },
          {
            "actionType": "MODIFY_COINS",
            "targetType": "POOREST_PLAYER",
            "value": 45
          }
        ]
      },
      {
        "id": "uno_09",
        "title": "احتراق أوراق المتصدر",
        "category": "PUBLIC_DRAMA",
        "flavorText": "المتصدر يتعثر ويخسر خمس رصيده فجأة!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 20
          }
        ]
      },
      {
        "id": "uno_10",
        "title": "سحبة الحظ العشوائية",
        "category": "PUBLIC_DRAMA",
        "flavorText": "لاعب عشوائي ينال نقاطاً إضافية ثمينة!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "RANDOM_OTHER",
            "value": 75
          }
        ]
      },
      {
        "id": "uno_11",
        "title": "تراجع إجباري في المسار",
        "category": "PUBLIC_DRAMA",
        "flavorText": "لاعب عشوائي يتراجع خطوات للخلف!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "RANDOM_OTHER",
            "value": -3
          }
        ]
      },
      {
        "id": "uno_12",
        "title": "توازن القوى التكتيكي",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضريبة على صاحب أعلى نقاط ودرع حماية للأضعف!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 15
          },
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "POOREST_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "uno_13",
        "title": "رمية أونو الصاعقة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "حركة بطاقات احترافية تمنحك 80 نقطة فورية!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": 80
          }
        ]
      },
      {
        "id": "uno_14",
        "title": "تصفية أوراق الطاولة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "خصم نقاط بنسبة 15% من جميع المنافسين!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "ALL_OTHERS",
            "value": 15
          }
        ]
      },
      {
        "id": "uno_15",
        "title": "محاكمة ناسي كلمة أونو",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من الذي بقي معه ورقة واحدة ولم ينبه الطاولة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -65
          }
        ]
      },
      {
        "id": "uno_16",
        "title": "اتهام بلعب ورقة خاطئة",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو اللاعب الذي غافل الجميع ولعب لوناً مخالفاً؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -70
          }
        ]
      },
      {
        "id": "uno_17",
        "title": "تصويت أسرع لاعب غشاش",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يسحب ورقتين ويدعي أنه سحب واحدة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -60
          }
        ]
      },
      {
        "id": "uno_18",
        "title": "عقوبة احتكار أوراق الجوكر",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يخبئ بطاقات +4 في كمه ويستحق الخسارة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -80
          }
        ]
      }
    ]
  },
  "ANCIENT_SULTANATE": {
    "themeTitle": "صراع سلاطين الشرق",
    "visualStyle": "ANCIENT_ARABIA",
    "archetype": "PARTY_ECONOMY",
    "winCondition": "MOST_COINS",
    "currencyName": "دينار ذهبي",
    "narratorIntro": "أهلاً بأسياد القوافل في قصر الخلافة! خزائن الذهب مشرعة، اشترِ الخانات والأسواق واجمع الدنانير!",
    "rulesConfig": {
      "turnMechanism": "DICE_AND_MOVE",
      "cardVisibility": "SECRET_PHONE_ONLY",
      "ownershipSystem": "BUY_AND_RENT"
    },
    "tiles": [
      {
        "index": 0,
        "tileType": "START",
        "name": "بوابة دمشق الكبرى",
        "description": "مرور القوافل المحملة بالحرير والتوابل يكسبك 100 دينار ذهبي.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 100
        }
      },
      {
        "index": 1,
        "tileType": "RESOURCE",
        "name": "سوق الحرير العتيق",
        "description": "دكاكين أقمشة فاخرة.",
        "price": 100,
        "rent": 25,
        "ownerId": null
      },
      {
        "index": 2,
        "tileType": "SECRET_CARD",
        "name": "خيمة المنجم",
        "description": "استشر عرّاف القصر واسحب حكمة سرية."
      },
      {
        "index": 3,
        "tileType": "RESOURCE",
        "name": "خان البهارات والتوابل",
        "description": "تجارة بهارات الهند والسند.",
        "price": 120,
        "rent": 30,
        "ownerId": null
      },
      {
        "index": 4,
        "tileType": "HAZARD",
        "name": "قطاع الطرق واللصوص",
        "description": "كمين لصوص الصحراء يسلب دنانيرك!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -35
        }
      },
      {
        "index": 5,
        "tileType": "RESOURCE",
        "name": "ميناء البصرة التجاري ⛵",
        "description": "مرسى السفن التجارية العملاقة.",
        "price": 180,
        "rent": 45,
        "ownerId": null
      },
      {
        "index": 6,
        "tileType": "RESOURCE",
        "name": "سوق العطور والعنبر",
        "description": "عطور ملكية ودهن عود خالص.",
        "price": 200,
        "rent": 50,
        "ownerId": null
      },
      {
        "index": 7,
        "tileType": "GLOBAL_VOTE",
        "name": "مجلس ديوان المظالم",
        "description": "محاسبة التجار المحتكرين والتصويت على تغريمهم!"
      },
      {
        "index": 8,
        "tileType": "RESOURCE",
        "name": "سوق صاغة الذهب",
        "description": "سبائك ذهبية وحلي تاريخية.",
        "price": 240,
        "rent": 60,
        "ownerId": null
      },
      {
        "index": 9,
        "tileType": "RESOURCE",
        "name": "قيسارية الأقمشة والكتان",
        "description": "سوق ملكي مسقوف للتجار الكبار.",
        "price": 260,
        "rent": 65,
        "ownerId": null
      },
      {
        "index": 10,
        "tileType": "RESOURCE",
        "name": "ميناء الإسكندرية والفنار 🏛️",
        "description": "بوابة التجارة مع بحر الروم.",
        "price": 180,
        "rent": 45,
        "ownerId": null
      },
      {
        "index": 11,
        "tileType": "DRAMA_EVENT",
        "name": "وصول أسطول السند",
        "description": "أرباح تجارية مضاعفة في الأسواق!"
      },
      {
        "index": 12,
        "tileType": "RESOURCE",
        "name": "بستان النخيل والتمور",
        "description": "تمور فاخرة مطلوبة في سائر الأمصار.",
        "price": 300,
        "rent": 75,
        "ownerId": null
      },
      {
        "index": 13,
        "tileType": "HAZARD",
        "name": "مكوس الحراس والضرائب",
        "description": "ضريبة مرور على بوابات المدن!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -50
        }
      },
      {
        "index": 14,
        "tileType": "RESOURCE",
        "name": "سوق الخيول العربية الأصيلة",
        "description": "جياد أصيلة لأمراء القصور.",
        "price": 320,
        "rent": 80,
        "ownerId": null
      },
      {
        "index": 15,
        "tileType": "GLOBAL_VOTE",
        "name": "شورى التجار الكبرى",
        "description": "تصويت أعيان السلطنة لمعاقبة التاجر المغرور!"
      },
      {
        "index": 16,
        "tileType": "RESOURCE",
        "name": "قصر الخلافة ومجلس السلطان",
        "description": "أعلى إيجار وأرفع مكانة في البلاد.",
        "price": 350,
        "rent": 90,
        "ownerId": null
      },
      {
        "index": 17,
        "tileType": "DRAMA_EVENT",
        "name": "عرس ولي العهد والأعطيات",
        "description": "توزيع دنانير ذهبية على الرعية!"
      },
      {
        "index": 18,
        "tileType": "RESOURCE",
        "name": "خزانة كنوز الأجداد 💎",
        "description": "جوهرة السلطنة وأعظم العقارات.",
        "price": 380,
        "rent": 95,
        "ownerId": null
      },
      {
        "index": 19,
        "tileType": "SECRET_CARD",
        "name": "الممر السري للبستان",
        "description": "اسحب فرماناً سلطانيا نادراً!"
      }
    ],
    "cardsDeck": [
      {
        "id": "sul_01",
        "title": "نشل أسواق بغداد",
        "category": "SECRET_HAND",
        "flavorText": "حركة خفيفة من شاطر محترف سرقت صرة دنانير من تاجر غافل!",
        "effects": [
          {
            "actionType": "STEAL_COINS",
            "targetType": "CHOSEN_PLAYER",
            "value": 55
          }
        ]
      },
      {
        "id": "sul_02",
        "title": "خاتم السلطان المزور",
        "category": "SECRET_HAND",
        "flavorText": "استخدمت ختماً مقلداً لتبديل مكانتك وقافلتك مع تاجر آخر!",
        "effects": [
          {
            "actionType": "SWAP_POSITIONS",
            "targetType": "CHOSEN_PLAYER",
            "value": 0
          }
        ]
      },
      {
        "id": "sul_03",
        "title": "توقيف الحراس للتفتيش",
        "category": "SECRET_HAND",
        "flavorText": "أمرت الحرس السلطاني باحتجاز خصمك وتفويت دوره!",
        "effects": [
          {
            "actionType": "SKIP_TURN",
            "targetType": "CHOSEN_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "sul_04",
        "title": "فرمان الأمان الإمبراطوري",
        "category": "SECRET_HAND",
        "flavorText": "مرسوم يحميك من أي دسائس أو غرامات موجهة ضدك!",
        "effects": [
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "SELF",
            "value": 1
          }
        ]
      },
      {
        "id": "sul_05",
        "title": "خيل عربية أصيلة",
        "category": "SECRET_HAND",
        "flavorText": "امتطيت جواداً سريعاً وقطعت أشواطاً متقدماً على الجميع!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "SELF",
            "value": 4
          }
        ]
      },
      {
        "id": "sul_06",
        "title": "زكاة التجار الكبار",
        "category": "SECRET_HAND",
        "flavorText": "أمرت بجمع زكاة الأموال من أغنى تاجر في المجلس فوراً!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 25
          }
        ]
      },
      {
        "id": "sul_07",
        "title": "قحط ومجاعة عابرة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "موجة جفاف رفعت أسعار المؤن وتسببت في خسارة مالية لجميع المنافسين!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "ALL_OTHERS",
            "value": -30
          }
        ]
      },
      {
        "id": "sul_08",
        "title": "صدقة الأمير السري",
        "category": "PUBLIC_DRAMA",
        "flavorText": "وهبت جزءاً من أموالك إحساناً لأفقر التجار في المجلس!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": -40
          },
          {
            "actionType": "MODIFY_COINS",
            "targetType": "POOREST_PLAYER",
            "value": 40
          }
        ]
      },
      {
        "id": "sul_09",
        "title": "غرق سفينة التوابل",
        "category": "PUBLIC_DRAMA",
        "flavorText": "عاصفة بحرية تغرق بضائع التاجر الأثرى في المجلس!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 20
          }
        ]
      },
      {
        "id": "sul_10",
        "title": "منحة الوالي للأشراف",
        "category": "PUBLIC_DRAMA",
        "flavorText": "صرة دنانير ذهبية تمنح لأحد التجار عشوائياً!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "RANDOM_OTHER",
            "value": 75
          }
        ]
      },
      {
        "id": "sul_11",
        "title": "تراجع القافلة للتزود",
        "category": "PUBLIC_DRAMA",
        "flavorText": "تاجر عشوائي يعود للواحة السابقة للتزود بالماء!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "RANDOM_OTHER",
            "value": -3
          }
        ]
      },
      {
        "id": "sul_12",
        "title": "حلف الفضول للعدالة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضريبة على الثري المتغطرس ودرع أمان للتاجر المبتدئ!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 15
          },
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "POOREST_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "sul_13",
        "title": "ربح صفقة العنبر الكبرى",
        "category": "PUBLIC_DRAMA",
        "flavorText": "بيعة تاريخية تملأ صناديقك بـ 85 ديناراً ذهبياً!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": 85
          }
        ]
      },
      {
        "id": "sul_14",
        "title": "عشور التجارة العامة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "مكوس إجبارية تقتطع نسبة دنانير من جميع المنافسين!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "ALL_OTHERS",
            "value": 15
          }
        ]
      },
      {
        "id": "sul_15",
        "title": "محاكمة غشاش الموازين",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو التاجر الذي يتلاعب بالميزان ويستحق غرامة المحتسب؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -65
          }
        ]
      },
      {
        "id": "sul_16",
        "title": "فتوى احتكار الأقوات",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يخفي البضائع لرفع الأسعار ويستحق العقوبة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -70
          }
        ]
      },
      {
        "id": "sul_17",
        "title": "استفتاء التباهي بالثروة",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو الأكثر تفاخراً بدنانيره ويستحق مصادرة جزء منها؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -60
          }
        ]
      },
      {
        "id": "sul_18",
        "title": "ديوان رد المظالم النهائي",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من الذي أضر ببقية التجار أكثر من غيره هذه الجولة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -80
          }
        ]
      }
    ]
  },
  "OFFICE_MAYHEM": {
    "themeTitle": "فوضى الشركات والدوام",
    "visualStyle": "CARTOON_OFFICE",
    "archetype": "SOCIAL_DEDUCTION",
    "winCondition": "LAST_SURVIVOR",
    "currencyName": "نقاط هيبة",
    "narratorIntro": "بيننا خائن مندس! تناقشوا بصوت عالٍ، حققوا مع المشتبه بهم، وصوتوا لإقصاء الجاسوس قبل أن يقضي عليكم!",
    "rulesConfig": {
      "turnMechanism": "SOCIAL_DISCUSSION_VOTE",
      "cardVisibility": "OPEN_PUBLIC_CARDS",
      "ownershipSystem": "NONE"
    },
    "tiles": [
      {
        "index": 0,
        "tileType": "START",
        "name": "دائرة التحقيق",
        "description": "منطقة الأمان وبدء الجولة +100 صوت ثقة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 100
        }
      },
      {
        "index": 1,
        "tileType": "RESOURCE",
        "name": "شهادة شاهد عيان",
        "description": "دليل يعزز ثقة الشلة بك.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 60
        }
      },
      {
        "index": 2,
        "tileType": "SECRET_CARD",
        "name": "ملف الأدلة السرية",
        "description": "اسحب وثيقة اتهام لهاتفك."
      },
      {
        "index": 3,
        "tileType": "HAZARD",
        "name": "زلة لسان محرجة",
        "description": "وقعت في فخ التناقض وفقدت ثقة الجميع!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -40
        }
      },
      {
        "index": 4,
        "tileType": "RESOURCE",
        "name": "حجة غياب قوية (Alibi)",
        "description": "أثبت براءتك واكتسبت أصوات ثقة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 70
        }
      },
      {
        "index": 5,
        "tileType": "DRAMA_EVENT",
        "name": "تسريب تسجيل صوتي 🎙️",
        "description": "فضيحة صوتية تهز الطاولة!"
      },
      {
        "index": 6,
        "tileType": "RESOURCE",
        "name": "تحليل لغة الجسد",
        "description": "كشفت ارتباك أحد الخصوم وربحت نقاطاً.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 65
        }
      },
      {
        "index": 7,
        "tileType": "GLOBAL_VOTE",
        "name": "جلسة الإعدام والتصويت",
        "description": "تصويت سري مباشر لإقصاء أكثر مشتبه به!"
      },
      {
        "index": 8,
        "tileType": "SECRET_CARD",
        "name": "تقرير المحقق الخاص",
        "description": "اسحب بطاقة كشف أسرار."
      },
      {
        "index": 9,
        "tileType": "HAZARD",
        "name": "شبهة تآمر ليلية",
        "description": "الأصابع تشير إليك بخسارة أصوات ثقة!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -45
        }
      },
      {
        "index": 10,
        "tileType": "RESOURCE",
        "name": "كشف مكيدة مدبرة",
        "description": "أفشلت مخطط المافيا واكتسبت هيبة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 75
        }
      },
      {
        "index": 11,
        "tileType": "DRAMA_EVENT",
        "name": "انقطاع مفاجئ للكهرباء 🕯️",
        "description": "فوضى عارمة واختفاء أدلة حاسمة!"
      },
      {
        "index": 12,
        "tileType": "SECRET_CARD",
        "name": "اعتراف مجهول المصدر",
        "description": "ورقة سرية تقلب موازين الاتهام."
      },
      {
        "index": 13,
        "tileType": "HAZARD",
        "name": "فحص جهاز كشف الكذب",
        "description": "نبضات قلبك المتسارعة أوقعتك في الشبهة!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -50
        }
      },
      {
        "index": 14,
        "tileType": "RESOURCE",
        "name": "إشادة رئيس التحقيق",
        "description": "مكافأة النزاهة والملاحظة الدقيقة.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 80
        }
      },
      {
        "index": 15,
        "tileType": "GLOBAL_VOTE",
        "name": "محاكمة الجاسوس الكبرى",
        "description": "تصويت نهائي إقصائي على من تثبت خيانته!"
      },
      {
        "index": 16,
        "tileType": "DRAMA_EVENT",
        "name": "انقلاب الحليف الأقرب",
        "description": "صديقك المقرب يطعنك بتهمة غير متوقعة!"
      },
      {
        "index": 17,
        "tileType": "HAZARD",
        "name": "عزل انفرادي مؤقت",
        "description": "إبعادك عن المداولات وخسارة رصيد!",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": -40
        }
      },
      {
        "index": 18,
        "tileType": "RESOURCE",
        "name": "وسام الشرف والحقيقة",
        "description": "أعلى رصيد ثقة يُمنح لأذكى محقق.",
        "defaultEffect": {
          "actionType": "MODIFY_COINS",
          "targetType": "SELF",
          "value": 85
        }
      },
      {
        "index": 19,
        "tileType": "SECRET_CARD",
        "name": "الورقة الأخيرة للبراءة",
        "description": "فرصة أخيرة لقلب الطاولة قبل التصويت!"
      }
    ],
    "cardsDeck": [
      {
        "id": "maf_01",
        "title": "استجواب مباغت",
        "category": "SECRET_HAND",
        "flavorText": "أحرجت أحد اللاعبين بسؤال محكم وسلبت ثقته!",
        "effects": [
          {
            "actionType": "STEAL_COINS",
            "targetType": "CHOSEN_PLAYER",
            "value": 50
          }
        ]
      },
      {
        "id": "maf_02",
        "title": "تبادل قناع البراءة",
        "category": "SECRET_HAND",
        "flavorText": "رميت التهمة على صديقك وبدلت موقعك معه!",
        "effects": [
          {
            "actionType": "SWAP_POSITIONS",
            "targetType": "CHOSEN_PLAYER",
            "value": 0
          }
        ]
      },
      {
        "id": "maf_03",
        "title": "تكميم الأفواه",
        "category": "SECRET_HAND",
        "flavorText": "منعت مشتبهاً به من الكلام وتفويت دوره في النقاش!",
        "effects": [
          {
            "actionType": "SKIP_TURN",
            "targetType": "CHOSEN_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "maf_04",
        "title": "حصانة دبلوماسية",
        "category": "SECRET_HAND",
        "flavorText": "وثيقة حصانة ترد عنك أي تصويت أو اتهام!",
        "effects": [
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "SELF",
            "value": 1
          }
        ]
      },
      {
        "id": "maf_05",
        "title": "هروب من التحقيق",
        "category": "SECRET_HAND",
        "flavorText": "قفزت للأمام وتفاديت دائرة الشبهات!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "SELF",
            "value": 4
          }
        ]
      },
      {
        "id": "maf_06",
        "title": "تفتيش الحسابات السرية",
        "category": "SECRET_HAND",
        "flavorText": "كشفت ثروة أكثر شخص يتظاهر بالبراءة!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 25
          }
        ]
      },
      {
        "id": "maf_07",
        "title": "شبهة عامة على الجميع",
        "category": "PUBLIC_DRAMA",
        "flavorText": "أدلة غامضة تهز ثقة الطاولة بجميع المتواجدين!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "ALL_OTHERS",
            "value": -30
          }
        ]
      },
      {
        "id": "maf_08",
        "title": "حماية الضحية المستهدفة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "ضحيت بجزء من ثقتك لإنقاذ أكثر لاعب مظلوم!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": -35
          },
          {
            "actionType": "MODIFY_COINS",
            "targetType": "POOREST_PLAYER",
            "value": 45
          }
        ]
      },
      {
        "id": "maf_09",
        "title": "سقوط زعيم العصابة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "أكثر لاعب نفوذاً يتعرض لانهيار ثقة دراماتيكي!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 20
          }
        ]
      },
      {
        "id": "maf_10",
        "title": "براءة غير متوقعة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "أحد المشتبه بهم عشوائياً تثبت براءته الكاملة!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "RANDOM_OTHER",
            "value": 75
          }
        ]
      },
      {
        "id": "maf_11",
        "title": "تراجع مصداقية الشاهد",
        "category": "PUBLIC_DRAMA",
        "flavorText": "لاعب عشوائي يتلعثم ويتراجع للخلف!",
        "effects": [
          {
            "actionType": "MOVE_STEPS",
            "targetType": "RANDOM_OTHER",
            "value": -3
          }
        ]
      },
      {
        "id": "maf_12",
        "title": "إنصاف المتهم البريء",
        "category": "PUBLIC_DRAMA",
        "flavorText": "خصم من صاحب أعلى أصوات ودعم للأقل رصيداً!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "RICHEST_PLAYER",
            "value": 15
          },
          {
            "actionType": "GRANT_SHIELD",
            "targetType": "POOREST_PLAYER",
            "value": 1
          }
        ]
      },
      {
        "id": "maf_13",
        "title": "خطاب براءة تاريخي",
        "category": "PUBLIC_DRAMA",
        "flavorText": "كلماتك المقنعة أقنعت الحضور ومنحتك 85 صوت ثقة!",
        "effects": [
          {
            "actionType": "MODIFY_COINS",
            "targetType": "SELF",
            "value": 85
          }
        ]
      },
      {
        "id": "maf_14",
        "title": "تفتيش شامل للطاولة",
        "category": "PUBLIC_DRAMA",
        "flavorText": "فحص وثائق يقتطع نسبة ثقة من جميع المنافسين!",
        "effects": [
          {
            "actionType": "TAX_PERCENTAGE",
            "targetType": "ALL_OTHERS",
            "value": 15
          }
        ]
      },
      {
        "id": "maf_15",
        "title": "تصويت طرد الجاسوس الأكبر",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو الجاسوس الأكثر مكراً الذي يجب إعدامه الليلة؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -70
          }
        ]
      },
      {
        "id": "maf_16",
        "title": "لائحة الخيانة العظمى",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو الصديق الأقل ثقة الذي لا يؤتمن جانبه؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -75
          }
        ]
      },
      {
        "id": "maf_17",
        "title": "محاكمة الممثل البارع",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من يتقن التمثيل والبكاء لتبرئة نفسه من التهم؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -60
          }
        ]
      },
      {
        "id": "maf_18",
        "title": "حكم الإقصاء النهائي",
        "category": "VOTE_CARD",
        "flavorText": "صوتوا: من هو أخطر لاعب على الطاولة ويجب عزله فوراً؟",
        "effects": [
          {
            "actionType": "VOTE_PENALTY",
            "targetType": "ALL_OTHERS",
            "value": -85
          }
        ]
      }
    ]
  }
};

// الألعاب السريعة الجديدة تُسجّل في نفس مكتبة القوالب حتى يعمل مسار
// البدء والبوتات والتصفير معها دون مسار خاص.
PRESET_PACKS.CONNECT_FOUR = CONNECT_FOUR_PACK;
PRESET_PACKS.CHECKERS_CLASSIC = CHECKERS_PACK;
PRESET_PACKS.BINGO_NIGHT = BINGO_PACK;

/**
 * 6. اختيار الحزمة المناسبة عند غياب الاتصال أو مفتاح الذكاء الاصطناعي
 */
export function getMatchingPresetPack(
  archetype?: string,
  prompt?: string,
  playerNames?: string[]
): GeneratedSessionPack {
  let pack: GeneratedSessionPack;
  const p = (prompt || "").toLowerCase();
  const arch = archetype?.toUpperCase();

  if (p.includes("مونوبولي") || p.includes("monopoly") || p.includes("عقار") || p.includes("عقارات")) {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.MONOPOLY_CLASSIC));
  } else if (p.includes("ريسك") || p.includes("risk") || p.includes("احتلال") || p.includes("غزو") || p.includes("أقاليم")) {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.WORLD_CONQUEST_RISK));
  } else if (p.includes("أونو") || p.includes("uno") || p.includes("أوراق") || p.includes("بطاقات")) {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.TACTICAL_CARDS_UNO));
  } else if (p.includes("مافيا") || p.includes("mafia") || p.includes("جاسوس") || p.includes("spy") || p.includes("تحقيق") || p.includes("سوالف")) {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.SOCIAL_MAFIA_SPY));
  } else if (p.includes("سلم") || p.includes("ثعبان") || p.includes("snakes") || p.includes("ladders")) {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.SNAKES_AND_LADDERS_RPG));
  } else if (p.includes("لودو") || p.includes("ludo") || p.includes("جاكارو") || p.includes("jackaroo")) {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.LUDO_CLASSIC));
  } else if (
    arch === "DECK_BATTLER" ||
    p.includes("cyber") ||
    p.includes("سايبر") ||
    p.includes("سرقة") ||
    p.includes("heist") ||
    p.includes("قرصنة")
  ) {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.TACTICAL_CARDS_UNO || PRESET_PACKS.CYBERPUNK_HEIST));
  } else if (
    arch === "SOCIAL_DEDUCTION" ||
    p.includes("office") ||
    p.includes("مكتب") ||
    p.includes("مكاتب") ||
    p.includes("انقلاب") ||
    p.includes("mayhem") ||
    p.includes("شركات")
  ) {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.SOCIAL_MAFIA_SPY || PRESET_PACKS.OFFICE_MAYHEM));
  } else if (arch === "BOARD_RACE") {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.SNAKES_AND_LADDERS_RPG));
  } else {
    pack = JSON.parse(JSON.stringify(PRESET_PACKS.MONOPOLY_CLASSIC || PRESET_PACKS.SULTANATE_MERCHANTS));
  }

  if (playerNames && playerNames.length > 0) {
    pack.narratorIntro = `${pack.narratorIntro} (مرحباً بالشجعان: ${playerNames.join("، ")})`;
  }

  return pack;
}

/**
 * 7. توليد حزمة لعبة كاملة بناءً على الثيم ونمط اللعبة واللاعبين
 */
export async function generateGameFromTheme(
  themePrompt: string,
  archetype?: GameArchetype,
  playerNames?: string[]
): Promise<GeneratedSessionPack> {
  const chosenArchetype = archetype || "PARTY_ECONOMY";
  const playersText =
    playerNames && playerNames.length > 0
      ? `اللاعبون المشاركون: [${playerNames.join("، ")}]. احرص على دمج أسمائهم بذكاء وفكاهة في بطاقات اللعبة والراوي.`
      : "صمم السهرة لمجموعة من الأصدقاء بأسماء وألقاب طريفة.";

  const archetypeGuidance = `
النمط المطلوب للعبة هو: ${chosenArchetype}
- إذا كان النمط "DECK_BATTLER": اجعل شرط الفوز TARGET_SCORE مع targetScore=350، وركز على بطاقات الهجوم وسرقة البطاقات والدروع.
- إذا كان النمط "PARTY_ECONOMY": اجعل شرط الفوز MOST_COINS، واعتمد نظام الملكية والإيجارات BUY_AND_RENT.
- إذا كان النمط "SOCIAL_DEDUCTION": اجعل شرط الفوز LAST_SURVIVOR، ونظام تحريك الدور SOCIAL_DISCUSSION_VOTE، وبطاقات مكشوفة OPEN_PUBLIC_CARDS.
- إذا كان النمط "BOARD_RACE": اجعل شرط الفوز FIRST_TO_FINISH، وركز على مسار السلالم والثعابين jumpToIndex.
`;

  const fullPrompt = `
موضوع وثيم السهرة المطلوب من اللاعبين: "${themePrompt}"
${archetypeGuidance}
${playersText}

صمم حزمة متكاملة (GeneratedSessionPack) تعكس هذا الثيم بدقة التوزيع الإجباري للمربعات (20 مربعاً) والبطاقات (18 بطاقة).
`;

  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
      console.warn("⚠️ No GOOGLE_GENERATIVE_AI_API_KEY found. Safely using matching preset pack.");
      return getMatchingPresetPack(chosenArchetype, themePrompt, playerNames);
    }

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: GeneratedSessionPackSchema,
      system: BOARD_GAME_SYSTEM_PROMPT,
      prompt: fullPrompt,
      temperature: 0.85
    });

    const sanitized = sanitizeGeneratedPack(object);
    if (archetype) {
      sanitized.archetype = archetype;
    }
    return sanitized;
  } catch (err) {
    console.warn("⚠️ Gemini generation encountered an error. Safely returning matching preset pack:", err);
    return getMatchingPresetPack(chosenArchetype, themePrompt, playerNames);
  }
}

/**
 * 8. الدالة الرئيسية التي يستدعيها خادم الغرفة
 */
export async function generateAISessionPack(
  input: RoomGenerationInput
): Promise<GeneratedSessionPack> {
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: GeneratedSessionPackSchema,
    system: BOARD_GAME_SYSTEM_PROMPT,
    prompt: buildUserPrompt(input),
    temperature: 0.85
  });

  return sanitizeGeneratedPack(object);
}

/**
 * 9. حزمة افتراضية للتطوير والاختبار المحلي بدون API key
 */
export function getDefaultSessionPack(playerNames: string[]): GeneratedSessionPack {
  const pack = JSON.parse(JSON.stringify(PRESET_PACKS.CYBERPUNK_HEIST));
  if (playerNames && playerNames.length > 0) {
    pack.narratorIntro = `أهلاً بكم يا شلة ${playerNames.join(" و ")}! الليلة مافي صداقة.. كل واحد يدبر حاله!`;
  }
  return pack;
}
