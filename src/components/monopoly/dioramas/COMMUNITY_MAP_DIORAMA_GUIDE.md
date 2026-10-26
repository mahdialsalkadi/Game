# دليل تصميم وتخصيص خلفيات الديوراما للمابات المجتمعية والمستقبلية
# Community Maps Diorama Architecture & Customization Guide

يوفر نظام المنصة المعيارية (Modular Living Diorama Engine) فصلاً كاملاً بين منطق اللعب (Core Rules) والعالم البصري للعبة (Theme & Visual Diorama). يضمن هذا النظام عدم تداخل خلفيات المدن (مثل خلفية الرياض، أتلانتيك سيتي، الفضاء، أو السايبربانك) بين المابات المختلفة.

---

## 🏛️ 1. بنية نظام الديوراما المعياري (Modular Architecture)

تتكون طبقة عرض الديوراما في مركز رقعة المونوبولي من المكونات التالية في مجلد `src/components/monopoly/dioramas/`:

1. **`ClassicAtlanticCityScene.tsx`**: مشهد أتلانتيك سيتي الأصلي لعام 1935 (الممشى الخشبي Boardwalk، فنادق الآرت ديكو Traymore، المنارة المخططة Absecon، العجلة الدوارة، وقطار Reading Railroad البخاري).
2. **`RiyadhMetropolisScene.tsx`**: مشهد العاصمة الرياض ثلاثي الأبعاد (برج المملكة، مركز KAFD المالي، برج الفيصلية، بوليفارد سيتي، الدرعية وقصر سلوى، ووادي حنيفة).
3. **`CyberpunkCityScene.tsx`**: مشهد سايبربانك 2088 (أبراج النيون الشاهقة، شبكة الليزر المتوهجة، القطار المعلق فائق السرعة، وسيارات السبنر الطائرة).
4. **`DeepSpaceScene.tsx`**: مشهد الفضاء السحيق (سحب السديم الكونية، الكوكب العملاق ذو الحلقات، محطة المدار Starbase Citadel، وبوابة القفز الهايبرسبيس).
5. **`MedievalKingdomScene.tsx`**: مشهد عصر الفرسان والتنانين (الجبال الشاهقة، القلعة الحجرية الضخمة، جسر الخندق المائي، والتنين الأسطوري).
6. **`index.ts`**: محول الميتا وسجل المشاهد العام `DioramaSceneRenderer` و `getDioramaMeta`.

---

## 🛠️ 2. كيف تضيف ماباً جديداً في المجتمع مع ديوراما مخصصة؟

لإضافة خريطة مجتمعية جديدة (مثلاً: خريطة باريس التاريخية، خريطة طوكيو المستقبلية، أو خريطة قراصنة الكاريبي):

### الخطوة 1: تعريف الخريطة في `src/game/communityMaps.ts`
حدد `themeId` فريداً للماب الخاص بك:
```typescript
{
  id: "community_pirates_cove",
  presetKey: "PIRATES_COVE",
  titleAr: "خليج القراصنة وجزيرة الكنز",
  themeId: "PIRATES_CARIBBEAN",
  category: "MONOPOLY",
  pack: applyThemeToGamePack(ORIGINAL_CLASSIC_MONOPOLY_PACK, "PIRATES_CARIBBEAN"),
  // ... باقي البيانات الوصفية
}
```

### الخطوة 2: إنشاء مكوّن المشهد في `src/components/monopoly/dioramas/`
أنشئ ملفاً باسم `PiratesCoveScene.tsx`:
```tsx
import React from "react";

export default function PiratesCoveScene() {
  return (
    <g id="piratesCoveScene">
      {/* سفينة القراصنة ذات الأشرعة السوداء، جزيرة الكنز، النخيل الاستوائي، وشاطئ المرجان */}
    </g>
  );
}
```

### الخطوة 3: تسجيل المشهد في `src/components/monopoly/dioramas/index.ts`
1. استورد المشهد الجديد.
2. أضف شرط الثيم في `getDioramaMeta`:
```typescript
const isPirates = themeId === "PIRATES_CARIBBEAN" || themeTitle?.includes("قراصنة");

if (isPirates) {
  return {
    themeKey: "PIRATES",
    title: "خليج القراصنة وجزيرة الكنز 🏴‍☠️",
    badge: "PIRATE ⚔️",
    chestTitle: "صندوق الكنز 🪙",
    chestSub: "PIRATE CHEST",
    chanceTitle: "خرائط الحظ 🗺️",
    chanceSub: "TREASURE MAP",
    skyGradient: "linear-gradient(180deg, #0284c7 0%, #38bdf8 40%, #fde047 100%)",
    rollAnnouncement: "نرد القراصنة يتدحرج على رمال الجزيرة... 🎲"
  };
}
```
3. أضف الحالة في `DioramaSceneRenderer`:
```tsx
case "PIRATES":
  return <PiratesCoveScene />;
```

---

## 🛡️ 3. ضمانات العزل البصري (Isolation Guarantees)

- **القاعدة الذهبية**: لا يُسمح أبداً لأي ماب كلاسيكي أو عالمي أن يرث معالم مدينة الرياض (أبراج المملكة، KAFD، أو الدرعية)، ولا العملة المحلية (الريال السعودي) ما لم يكن الماب مخصصاً للرياض صراحة (`RIYADH_VIP` أو `ARABIAN_MAJLIS`).
- **الملاذ الآمن (Fallback)**: أي ماب مستقبلي جديد لم يُعرّف له مشهد مخصص بعد، يعرض المشهد الكلاسيكي المحايد بألوان عالمية فاخرة دون إظهار أي مبانٍ لا تخصه.
