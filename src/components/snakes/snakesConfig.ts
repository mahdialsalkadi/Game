export interface LadderDef {
  from: number; // 1-based square number
  to: number;   // 1-based square number
  nameAr: string;
  color: string;
  loreAr?: string;
  woodColor?: string;
  woodLight?: string;
  ropeColor?: string;
  isGiant?: boolean;
}

export interface SnakeDef {
  from: number; // 1-based square number (Head)
  to: number;   // 1-based square number (Tail)
  nameAr: string;
  color: string;
  bellyColor: string;
  secondaryColor?: string;
  eyeColor?: string;
  speciesAr?: string;
  loreAr?: string;
  waveCount?: number;
  waveAmp?: number;
}

export interface BiomeDef {
  id: string;
  nameAr: string;
  range: [number, number];
  stoneGradient: [string, string];
  stoneBorder: string;
  textColor: string;
  accentColor: string;
  icon: string;
  descriptionAr: string;
}

export const BIOMES: BiomeDef[] = [
  {
    id: "oasis",
    nameAr: "واحة البداية والغابة العتيقة",
    range: [1, 20],
    stoneGradient: ["#1e3325", "#13231a"],
    stoneBorder: "#2d5a3e",
    textColor: "#a7f3d0",
    accentColor: "#10b981",
    icon: "🌴",
    descriptionAr: "مصب الينبوع العذب وغابة النخيل، حيث تبدأ رحلة الاستكشاف."
  },
  {
    id: "canyon",
    nameAr: "وادي الرمال والآثار المنحوتة",
    range: [21, 40],
    stoneGradient: ["#382717", "#271a0f"],
    stoneBorder: "#634024",
    textColor: "#fed7aa",
    accentColor: "#f59e0b",
    icon: "🏜️",
    descriptionAr: "كثبان رملية ذهبية وآثار فرعونية عتيقة تخفي سلماً عملاقاً نحو النجوم."
  },
  {
    id: "cavern",
    nameAr: "مضيق البازلت والحمم الهادئة",
    range: [41, 60],
    stoneGradient: ["#291b29", "#1b121b"],
    stoneBorder: "#553355",
    textColor: "#f5d0fe",
    accentColor: "#d946ef",
    icon: "🌋",
    descriptionAr: "صخور بازلتية سوداء ذات شقوق جمرية متوهجة تحيط بها أفاعي الصخور."
  },
  {
    id: "storm",
    nameAr: "هضبة العواصف والرعود الشاهقة",
    range: [61, 80],
    stoneGradient: ["#1d2338", "#131726"],
    stoneBorder: "#36456b",
    textColor: "#c7d2fe",
    accentColor: "#6366f1",
    icon: "⚡",
    descriptionAr: "رياح عاتية وصواعق تضيء قمم الصخور الوعرة ومسارات الأفاعي الغادرة."
  },
  {
    id: "celestial",
    nameAr: "قمة المجد وعرش التنين الذهبي",
    range: [81, 100],
    stoneGradient: ["#3b3017", "#28200f"],
    stoneBorder: "#785e25",
    textColor: "#fef08a",
    accentColor: "#eab308",
    icon: "👑",
    descriptionAr: "أعلى قمة في العالم القديم، حيث يربض التنين الأسطوري حامياً كنز النصر."
  }
];

export function getBiomeForSquare(squareNumber: number): BiomeDef {
  const sq = Math.max(1, Math.min(100, squareNumber));
  return BIOMES.find((b) => sq >= b.range[0] && sq <= b.range[1]) ?? BIOMES[0];
}

export const LADDERS: LadderDef[] = [
  {
    from: 4,
    to: 14,
    nameAr: "سلم الخيزران 🪜",
    color: "#F59E0B",
    woodColor: "#854D0E",
    woodLight: "#A16207",
    ropeColor: "#CA8A04",
    loreAr: "درجات خيزرانية خفيفة تنقلك عبر قنوات واحة البداية (+10 خطوات)."
  },
  {
    from: 9,
    to: 31,
    nameAr: "سلم الحبل المتين 🪜",
    color: "#EAB308",
    woodColor: "#78350F",
    woodLight: "#92400E",
    ropeColor: "#F59E0B",
    loreAr: "حبال قنب عتيقة مشدودة بأوتاد حجرية تصعد بك من الغابة إلى هضبة الآثار (+22 خطوة)."
  },
  {
    from: 20,
    to: 38,
    nameAr: "سلم القلعة العتيق 🪜",
    color: "#D97706",
    woodColor: "#573010",
    woodLight: "#78350F",
    ropeColor: "#D97706",
    loreAr: "سلم خشبي ثقيل من خشب الأرز يعبر بك جدار القلعة المهجورة (+18 خطوة)."
  },
  {
    from: 28,
    to: 84,
    nameAr: "سلم النجوم العملاق 🪜",
    color: "#FBBF24",
    woodColor: "#92400E",
    woodLight: "#B45309",
    ropeColor: "#FCD34D",
    isGiant: true,
    loreAr: "أعظم سلالم الخريطة الأسطورية! جسر شاهق يقفز بك 56 خطوة كاملة إلى مشارف قمة المجد!"
  },
  {
    from: 40,
    to: 59,
    nameAr: "سلم الجبل الوعر 🪜",
    color: "#B45309",
    woodColor: "#6B3A19",
    woodLight: "#8B4513",
    ropeColor: "#D97706",
    loreAr: "درجات جبلية منحوتة ومدعمة بألواح البلوط لتسلق هوة المضيق البركاني (+19 خطوة)."
  },
  {
    from: 51,
    to: 67,
    nameAr: "سلم البرج الرخامي 🪜",
    color: "#FCD34D",
    woodColor: "#7C2D12",
    woodLight: "#9A3412",
    ropeColor: "#FBBF24",
    loreAr: "سقالة خشبية عتيقة تمكنك من تجاوز برج الحراسة الصخري نحو هضبة الرعود (+16 خطوة)."
  },
  {
    from: 63,
    to: 81,
    nameAr: "سلم السحاب الفضي 🪜",
    color: "#E0E7FF",
    woodColor: "#475569",
    woodLight: "#64748B",
    ropeColor: "#E2E8F0",
    loreAr: "سلم أبيض مغسول بأمطار السحاب يرفعك فوق طبقات الغيوم (+18 خطوة)."
  },
  {
    from: 71,
    to: 91,
    nameAr: "سلم قمة المجد 🪜",
    color: "#FDE047",
    woodColor: "#B45309",
    woodLight: "#D97706",
    ropeColor: "#FEF08A",
    isGiant: true,
    loreAr: "سلم الطوارئ الذهبي الذي يضعك في الرمق الأخير على عتبة النصر (+20 خطوة)!"
  }
];

export const SNAKES: SnakeDef[] = [
  {
    from: 17,
    to: 7,
    nameAr: "أفعى الزمرد الخضراء 🐍",
    speciesAr: "أفعى واحة النخيل",
    color: "#10B981",
    secondaryColor: "#064E3B",
    bellyColor: "#A7F3D0",
    eyeColor: "#FDE047",
    waveCount: 2,
    waveAmp: 22,
    loreAr: "تتربص بين أشجار النخيل وتنزلق بك 10 خطوات للوراء نحو مجرى النهر."
  },
  {
    from: 54,
    to: 34,
    nameAr: "ثعبان الصخور الصحراوي 🐍",
    speciesAr: "أفعى الرمال القرناء",
    color: "#F97316",
    secondaryColor: "#9A3412",
    bellyColor: "#FED7AA",
    eyeColor: "#EF4444",
    waveCount: 2.5,
    waveAmp: 28,
    loreAr: "ثعبان رملي متحجر يسحبك 20 خطوة نحو حافة الوادي المجدب."
  },
  {
    from: 62,
    to: 19,
    nameAr: "أفعى الوادي السحيق القاتلة 🐍",
    speciesAr: "تنين الهوة السحيقة",
    color: "#EF4444",
    secondaryColor: "#7F1D1D",
    bellyColor: "#FECACA",
    eyeColor: "#FBBF24",
    waveCount: 3.5,
    waveAmp: 34,
    loreAr: "أفعى حمراء عملاقة تهوي بك 43 خطوة سحيقة من مشارف العواصف إلى عتبة البداية!"
  },
  {
    from: 64,
    to: 60,
    nameAr: "ثعبان المستنقع النيلي 🐍",
    speciesAr: "أصلة الأنهار العاتية",
    color: "#06B6D4",
    secondaryColor: "#0E7490",
    bellyColor: "#CFFAFE",
    eyeColor: "#FACC15",
    waveCount: 2,
    waveAmp: 20,
    loreAr: "يلتوي حول ممر الجبل ليعيدك 4 خطوات نحو حافة المستنقع."
  },
  {
    from: 87,
    to: 24,
    nameAr: "ثعبان الصحراء الكبرى الغادر 🐍",
    speciesAr: "أناكوندا الكثبان العظيمة",
    color: "#E11D48",
    secondaryColor: "#881337",
    bellyColor: "#FFE4E6",
    eyeColor: "#FBBF24",
    waveCount: 4,
    waveAmp: 36,
    loreAr: "الكابوس الأكبر للرحالة! انزلاق مرعب يمحو 63 خطوة من التقدم ويقذفك للرمال!"
  },
  {
    from: 93,
    to: 73,
    nameAr: "أفعى الرياح الأرجوانية 🐍",
    speciesAr: "أفعى الصواعق الجبلية",
    color: "#8B5CF6",
    secondaryColor: "#4C1D95",
    bellyColor: "#EDE9FE",
    eyeColor: "#34D399",
    waveCount: 2.8,
    waveAmp: 26,
    loreAr: "تلتف حول قمة الجبل وتسقطك 20 خطوة في دوامة الضباب."
  },
  {
    from: 95,
    to: 75,
    nameAr: "ثعبان الشفق القرمزي 🐍",
    speciesAr: "أفعى الشفق الناري",
    color: "#EC4899",
    secondaryColor: "#9D174D",
    bellyColor: "#FCE7F3",
    eyeColor: "#FDE047",
    waveCount: 2.5,
    waveAmp: 24,
    loreAr: "لدغة نارية على بعد خمس خطوات فقط من القمة تعيدك 20 خطوة للوراء!"
  },
  {
    from: 99,
    to: 78,
    nameAr: "التنين الثعباني الأسطوري حارس العرش 🐍",
    speciesAr: "حارس بوابة النصر 100",
    color: "#DC2626",
    secondaryColor: "#450A0A",
    bellyColor: "#FDE047",
    eyeColor: "#F97316",
    waveCount: 3,
    waveAmp: 30,
    loreAr: "حارس العرش في المربع 99! خطوة واحدة قبل التتويج تهوي بك 21 خطوة إلى الصخور!"
  }
];

/**
 * Maps 1-based square (1-100) to 10x10 zigzag grid coordinates.
 * Row 1 (squares 1-10) is bottom row (row index 9), left-to-right (col 0 to 9).
 * Row 2 (squares 11-20) is row index 8, right-to-left (col 9 to 0).
 * ...
 * Row 10 (squares 91-100) is top row (row index 0), right-to-left (col 9 to 0).
 */
export function getSquareCoordinates(squareNumber: number): {
  col: number;
  row: number;
  xPercent: number;
  yPercent: number;
  cx: number;
  cy: number;
} {
  const sq = Math.max(1, Math.min(100, squareNumber));
  const rowFromBottom = Math.floor((sq - 1) / 10);
  const row = 9 - rowFromBottom; // 0 at top, 9 at bottom
  const isOddRow = rowFromBottom % 2 === 1;
  const col = isOddRow ? 9 - ((sq - 1) % 10) : (sq - 1) % 10;
  const xPercent = (col + 0.5) * 10;
  const yPercent = (row + 0.5) * 10;
  const cx = (col + 0.5) * 100;
  const cy = (row + 0.5) * 100;
  return { col, row, xPercent, yPercent, cx, cy };
}

/**
 * Formats square numbers in Arabic-Indic digits alongside Latin numerals.
 */
export function formatSquareNumber(sq: number): { ar: string; en: string } {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const ar = String(sq)
    .split("")
    .map((d) => arabicDigits[Number(d)] ?? d)
    .join("");
  return { ar, en: String(sq) };
}

/**
 * Returns nearest ladder and nearest snake relative to player's current position.
 */
export function getSurroundingThreatsAndOpportunities(currentSquare: number): {
  nearestLadder: { ladder: LadderDef; distance: number } | null;
  nearestSnake: { snake: SnakeDef; distance: number } | null;
} {
  let nearestLadder: { ladder: LadderDef; distance: number } | null = null;
  let nearestSnake: { snake: SnakeDef; distance: number } | null = null;

  for (const l of LADDERS) {
    if (l.from >= currentSquare) {
      const distance = l.from - currentSquare;
      if (!nearestLadder || distance < nearestLadder.distance) {
        nearestLadder = { ladder: l, distance };
      }
    }
  }

  for (const s of SNAKES) {
    if (s.from >= currentSquare) {
      const distance = s.from - currentSquare;
      if (!nearestSnake || distance < nearestSnake.distance) {
        nearestSnake = { snake: s, distance };
      }
    }
  }

  return { nearestLadder, nearestSnake };
}
