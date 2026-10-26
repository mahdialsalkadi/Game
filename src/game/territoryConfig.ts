/**
 * ثوابت قواعد غزو الأقاليم (Risk) — آمنة للاستيراد في مكوّنات العميل.
 * تُستخدم من المحرك (TerritoryEngine) ومن واجهات الطاولة والجوال.
 */
export const TERRITORY_ACTIONS_PER_TURN = 3;
export const TERRITORY_ATTACK_COST = 20;
export const TERRITORY_REINFORCE_COST = 20;
export const TERRITORY_INCOME_UNIT = 20;
export const TERRITORY_WIN_RATIO = 0.75;
/** تكلفة كل كتيبة مهاجمة تخسرها في مقارنة النرد (تُخصم من الاحتياط). */
export const TERRITORY_CASUALTY_COST = 10;

/** مدة مهلة قرار الشراء في المونوبولي (تُدار من المحرك) */
export const MONOPOLY_PURCHASE_WINDOW_MS = 20000;
