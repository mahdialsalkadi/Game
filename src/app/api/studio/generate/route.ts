import { NextResponse } from "next/server";
import { generateAISessionPack, getMatchingPresetPack, PRESET_PACKS } from "@/game/aiPackGenerator";
import { GeneratedSessionPackSchema, type GeneratedSessionPack } from "@/game/schema";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt: string = body.prompt || "";
    const requestedArchetype = body.archetype;
    const requestedWinCondition = body.winCondition;
    const currentPack: GeneratedSessionPack | undefined = body.currentPack;
    const remixInstruction: string | undefined = body.remixInstruction;
    const presetKey: string | undefined = body.presetKey;

    // 1. Direct Preset Selection
    if (presetKey && PRESET_PACKS[presetKey]) {
      const selected = JSON.parse(JSON.stringify(PRESET_PACKS[presetKey]));
      return NextResponse.json({
        success: true,
        pack: selected,
        source: "PRESET_LOADED"
      });
    }

    // 2. AI Co-Pilot Remix Mode (Existing Pack + Instruction)
    if (currentPack && remixInstruction && remixInstruction.trim().length > 0) {
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("AI_TIMEOUT")), 12000)
          );

          const aiPromise = generateObject({
            model: google("gemini-2.5-flash"),
            schema: GeneratedSessionPackSchema,
            system: `أنت مساعد ومستشار ذكي لاستوديو تصميم ألعاب الطاولة (AI Co-Designer). مهمتك إعادة تشكيل وتعديل حزمة اللعبة الحالية بناءً على تعليمات المستخدم. حافظ على 20 مربعاً و 15-25 بطاقة وقواعد الـ rulesConfig المناسبة.`,
            prompt: `
عدّل هذه الحزمة الحالية:
${JSON.stringify({
  themeTitle: currentPack.themeTitle,
  visualStyle: currentPack.visualStyle,
  archetype: currentPack.archetype,
  rulesConfig: currentPack.rulesConfig,
  winCondition: currentPack.winCondition,
  currencyName: currentPack.currencyName,
  tilesCount: currentPack.tiles.length,
  sampleTiles: currentPack.tiles.slice(0, 5),
  sampleCards: currentPack.cardsDeck.slice(0, 5)
}, null, 2)}

تعليمات المستخدم للتعديل (Remix Instruction):
"${remixInstruction}"

أعد إنتاج الحزمة بالكامل مطابقة لتعليمات المستخدم مع الحفاظ على التوازن الهندسي.
`,
            temperature: 0.8
          });

          const { object } = await Promise.race([aiPromise, timeoutPromise]);
          return NextResponse.json({
            success: true,
            pack: object,
            source: "AI_CO_DESIGNER_REMIX"
          });
        } catch (remixErr) {
          console.warn("[Studio API] AI Co-Pilot Remix failed, using local remix:", remixErr);
        }
      }

      // Local smart remix fallback
      const remixed: GeneratedSessionPack = JSON.parse(JSON.stringify(currentPack));
      remixed.themeTitle = `${currentPack.themeTitle} (نسخة ريمكس)`;
      remixed.narratorIntro = `تعديل استوديو بالذكاء الاصطناعي: ${remixInstruction.slice(0, 80)}!`;
      
      // If user mentioned rent/properties
      if (remixInstruction.includes("إيجار") || remixInstruction.includes("عقار") || remixInstruction.includes("سعر")) {
        remixed.tiles.forEach((tile) => {
          if (tile.price !== undefined) tile.price = Math.round(tile.price * 1.5);
          if (tile.rent !== undefined) tile.rent = Math.round(tile.rent * 1.5);
        });
      }
      return NextResponse.json({
        success: true,
        pack: remixed,
        source: "LOCAL_SMART_REMIX"
      });
    }

    // 3. Prompt-based Generation
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY && prompt.trim().length > 0) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI_TIMEOUT")), 10000)
        );

        const aiPromise = generateAISessionPack({
          players: [
            { name: "اللاعب الأول", promptIdea: prompt },
            { name: "اللاعب الثاني", promptIdea: prompt }
          ],
          pastGroupLore: [prompt]
        });

        const generatedPack = await Promise.race([aiPromise, timeoutPromise]);
        if (requestedArchetype) generatedPack.archetype = requestedArchetype;
        if (requestedWinCondition) generatedPack.winCondition = requestedWinCondition;

        return NextResponse.json({
          success: true,
          pack: generatedPack,
          source: "AI_GENERATED"
        });
      } catch (aiErr) {
        console.warn("[Studio API] AI generation failed or timed out, falling back to smart template:", aiErr);
      }
    }

    // 4. Smart Template based on prompt keywords
    const basePack = getMatchingPresetPack(requestedArchetype, prompt, ["صانع الألعاب"]);

    if (prompt.trim()) {
      basePack.themeTitle = prompt.length > 35 ? prompt.slice(0, 35) : prompt;
      basePack.narratorIntro = `أهلاً بكم في سهرة (${prompt})! استعدوا لأقوى جولة تنافس وكوميديا الليلة!`;
    }
    if (requestedArchetype) basePack.archetype = requestedArchetype;
    if (requestedWinCondition) basePack.winCondition = requestedWinCondition;

    return NextResponse.json({
      success: true,
      pack: basePack,
      source: "TEMPLATE_FALLBACK"
    });
  } catch (error: any) {
    console.error("[Studio API] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate pack"
      },
      { status: 500 }
    );
  }
}
