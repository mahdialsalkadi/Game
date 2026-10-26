"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Layers,
  Grid,
  Download,
  ArrowRight,
  Wand2,
  Trophy,
  Coins,
  Palette,
  Loader2,
  Play,
  Settings2,
  Building2,
  Shield,
  Eye,
  Dices,
  Globe,
  Save,
  Brain,
  User,
  Check
} from "lucide-react";
import BoardEditor from "@/components/studio/BoardEditor";
import CardDeckEditor from "@/components/studio/CardDeckEditor";
import GamePackExporter from "@/components/studio/GamePackExporter";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { STUDIO_PRESETS, PRESET_PACKS, COMMUNITY_MAPS } from "@/components/studio/presets";
import type { UserAccount } from "@/game/userStore";
import type {
  GeneratedSessionPack,
  GameArchetype,
  WinCondition,
  TurnMechanism,
  OwnershipSystem,
  CardVisibility
} from "@/game/schema";

const QUICK_REMIX_CHIPS = [
  "🏰 حرب قراصنة وعقارات بإيجارات مضاعفة",
  "⚔️ تحويلها لاحتلال أقاليم عسكرية وجيوش بدون نرد",
  "🕵️ تحقيق بوليسي غامض مع بطاقات علنية ونقاش",
  "🪜 سباق سلالم وثعابين ومكافآت خيالية",
  "☕ بيئة دوام شركات ومكائد HR مع خصومات قاسية"
];

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetQuery = searchParams.get("preset");
  const remixId = searchParams.get("remixId");
  const gameId = searchParams.get("gameId");

  const resolvePresetPack = (key: string | null | undefined) => {
    if (!key) return undefined;
    // خرائط المجتمع أولاً: قد تحمل نفس مفتاح حزمة قديمة في PRESET_PACKS
    // لكن بنسخة منسّقة وأكثر ثراءً (ثيم/أسعار/نصوص).
    const community = COMMUNITY_MAPS.find(
      (map) => map.presetKey === key || map.id === key
    );
    return community?.pack || PRESET_PACKS[key];
  };

  const [pack, setPack] = useState<GeneratedSessionPack>(() => {
    const presetPack = resolvePresetPack(presetQuery);
    if (presetPack) {
      return JSON.parse(JSON.stringify(presetPack));
    }
    return JSON.parse(JSON.stringify(PRESET_PACKS.MONOPOLY_CLASSIC || PRESET_PACKS.SULTANATE_MERCHANTS));
  });

  /** المفتاح المختار في القائمة — لا نستنتجه من العنوان لأنه غير فريد. */
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>(() => {
    if (!presetQuery) return "";
    const known =
      Boolean(PRESET_PACKS[presetQuery]) ||
      COMMUNITY_MAPS.some((map) => map.presetKey === presetQuery || map.id === presetQuery);
    return known ? presetQuery : "";
  });

  /** خيارات القائمة = قوالب الاستوديو + كل خرائط المجتمع غير المكررة. */
  const presetOptions = React.useMemo(() => {
    const options = new Map<string, { key: string; label: string }>();
    for (const [key, item] of Object.entries(STUDIO_PRESETS)) {
      options.set(key, { key, label: item.label });
    }
    for (const map of COMMUNITY_MAPS) {
      options.set(map.presetKey, {
        key: map.presetKey,
        label: `🗺️ ${map.titleAr}`
      });
    }
    return Array.from(options.values());
  }, []);

  const [activeTab, setActiveTab] = useState<"board" | "cards" | "rules" | "export">("board");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with preset query if changed
  useEffect(() => {
    const presetPack = resolvePresetPack(presetQuery);
    if (presetPack) {
      setPack(JSON.parse(JSON.stringify(presetPack)));
      setSelectedPresetKey(presetQuery || "");
    }
  }, [presetQuery]);

  // Deep links: ?remixId=<community game> or ?gameId=<saved game>
  useEffect(() => {
    const targetId = remixId || gameId;
    if (!targetId) return;

    let cancelled = false;
    const loadGame = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("boardgame_user_token")
            : null;
        const urls = new Set<string>(["/api/community"]);
        if (token) {
          urls.add(`/api/community?authorId=${encodeURIComponent(token)}`);
        }

        const responses = await Promise.all(
          Array.from(urls).map((url) =>
            fetch(url)
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null)
          )
        );

        const games = responses.flatMap((data) =>
          Array.isArray(data?.games) ? data.games : []
        );
        const match = games.find((game: { id?: string }) => game?.id === targetId);
        if (!match?.pack || cancelled) return;

        setPack(JSON.parse(JSON.stringify(match.pack)));
        setSelectedPresetKey("");
        setSaveStatus({
          message:
            remixId
              ? "تم تحميل الحزمة بوضع الريمكس — احفظها لإنشاء نسخة خاصة بك."
              : "تم تحميل اللعبة المحفوظة للتعديل.",
          type: "success"
        });
        setTimeout(() => setSaveStatus(null), 5000);
      } catch {
        if (!cancelled) {
          setSaveStatus({
            message: "تعذر تحميل اللعبة المطلوبة — قد تكون خاصة أو محذوفة.",
            type: "error"
          });
        }
      }
    };

    loadGame();
    return () => {
      cancelled = true;
    };
  }, [remixId, gameId]);

  // Load user from /api/auth/me
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("boardgame_user_token");
    if (!token) return;

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveGame = async (visibility: "PRIVATE" | "PUBLIC") => {
    const token = typeof window !== "undefined" ? localStorage.getItem("boardgame_user_token") : null;
    if (!token) {
      setSaveStatus({ message: "يرجى تسجيل الدخول أولاً لحفظ أو نشر اللعبة في حسابك", type: "error" });
      setIsProfileOpen(true);
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          authorId: token,
          pack,
          visibility
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل حفظ اللعبة");
      }

      setSaveStatus({
        message: visibility === "PUBLIC" ? "تم نشر اللعبة في مكتبة المجتمع بنجاح! 🌐" : "تم حفظ اللعبة بنجاح في حسابك الخاص! 💾",
        type: "success"
      });

      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setSaveStatus({ message: err.message || "حدث خطأ أثناء الحفظ", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // AI Co-Pilot Remix
  const handleRemixAI = async (customInstruction?: string) => {
    const instruction = customInstruction || aiPrompt;
    if (!instruction.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPack: pack,
          remixInstruction: instruction.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.pack) {
        setPack(data.pack);
        setAiPrompt("");
      } else {
        setGenerationError(data.error || "تعذر إعادة تشكيل الحزمة بالذكاء الاصطناعي");
      }
    } catch (err: any) {
      setGenerationError(err.message || "حدث خطأ في الاتصال بالمساعد الذكي");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPreset = (presetKey: string) => {
    const resolved = resolvePresetPack(presetKey);
    if (!resolved) return;
    setPack(JSON.parse(JSON.stringify(resolved)));
    setSelectedPresetKey(presetKey);
  };

  // Launch One-Click Game Room
  const handleLaunchGame = async () => {
    setIsLaunching(true);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("custom_studio_pack", JSON.stringify(pack));
      }
      const res = await fetch("/api/rooms", { method: "POST" });
      const data = await res.json();
      if (data.success && data.roomId) {
        router.push(`/host/${data.roomId}`);
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    } finally {
      setIsLaunching(false);
    }
  };

  const rules = pack.rulesConfig || {
    turnMechanism: "DICE_AND_MOVE",
    cardVisibility: "SECRET_PHONE_ONLY",
    ownershipSystem: "NONE"
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none"
    >
      {/* Top Studio Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xl gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-bold"
          >
            <ArrowRight className="w-4 h-4" />
            الرئيسية
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛠️</span>
            <div>
              <h1 className="text-lg font-black tracking-tight">استوديو صانع الألعاب العالمية</h1>
              <p className="text-[11px] text-slate-400">صمم، عدّل القواعد، واصنع لعبتك بالذكاء الاصطناعي</p>
            </div>
          </div>
        </div>

        {/* Preset Selector, Save, Publish & Launch Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">القالب:</span>
            <select
              onChange={(e) => handleSelectPreset(e.target.value)}
              value={selectedPresetKey}
              className="bg-slate-800 border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-amber-300 outline-none focus:border-amber-400 cursor-pointer max-w-[170px] truncate"
            >
              {selectedPresetKey === "" && (
                <option value="" disabled>
                  — حزمة محفوظة / مخصصة —
                </option>
              )}
              {presetOptions.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleSaveGame("PRIVATE")}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="حفظ اللعبة في حسابك الشخصي"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">حفظ خاص 💾</span>
          </button>

          <button
            onClick={() => handleSaveGame("PUBLIC")}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/50 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="نشر اللعبة في مكتبة المجتمع للجميع"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">نشر في المجتمع 🌐</span>
          </button>

          <button
            onClick={handleLaunchGame}
            disabled={isLaunching}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            {isLaunching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>العب فوراً 🚀</span>
          </button>

          {/* User Profile Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 flex items-center gap-1 text-xs font-bold transition-colors"
            title="الملف الشخصي والبصمة السلوكية"
          >
            <Brain className="w-4 h-4" />
            {currentUser ? (
              <span className="hidden md:inline text-white font-bold max-w-[80px] truncate">{currentUser.username}</span>
            ) : (
              <span className="hidden md:inline">دخول</span>
            )}
          </button>
        </div>
      </header>

      {/* Save Status Toast */}
      {saveStatus && (
        <div
          className={`px-6 py-2.5 text-center text-xs font-bold transition-all ${
            saveStatus.type === "success"
              ? "bg-emerald-950 border-b border-emerald-500 text-emerald-300"
              : "bg-rose-950 border-b border-rose-500 text-rose-300"
          }`}
        >
          {saveStatus.message}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* AI Co-Pilot Remix Bar */}
        <section className="bg-gradient-to-r from-purple-950/80 via-slate-900/95 to-indigo-950/80 border border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-sm font-black text-purple-200">
                المصمم الذكي التفاعلي (AI Co-Pilot Remix)
              </span>
            </div>
            <span className="text-[11px] text-purple-300/80 font-bold">
              يعدّل القواعد والمربعات والبطاقات لحظياً
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="اكتب تعليمات التعديل (مثلاً: حول اللعبة إلى صراع فضاء مع إيجارات صاروخية، أو أضف بطاقات غدر سريعة)..."
              className="flex-1 w-full bg-slate-950/90 border border-purple-500/40 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-400 shadow-inner"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRemixAI();
              }}
            />
            <button
              disabled={isGenerating || !aiPrompt.trim()}
              onClick={() => handleRemixAI()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all shrink-0 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تعديل اللعبة...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>تطبيق الريمكس 🪄</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-bold shrink-0">أفكار سريعة:</span>
            {QUICK_REMIX_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleRemixAI(chip)}
                className="px-2.5 py-1 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-200 hover:bg-purple-800/40 text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>

          {generationError && (
            <p className="text-xs text-rose-400 mt-2 px-1 font-bold">{generationError}</p>
          )}
        </section>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("board")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "board"
                ? "bg-amber-500 text-slate-950 shadow-lg scale-105"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>لوحة اللعب ({pack.tiles.length} مربعاً)</span>
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "cards"
                ? "bg-indigo-600 text-white shadow-lg scale-105"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>مجموعة البطاقات ({pack.cardsDeck.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "rules"
                ? "bg-cyan-500 text-slate-950 shadow-lg scale-105"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>قواعد المحرك الميكانيكية ⚙️</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
              activeTab === "export"
                ? "bg-emerald-500 text-slate-950 shadow-lg scale-105"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>تصدير ولعب فوري 🎲</span>
          </button>
        </nav>

        {/* Active Tab View */}
        <div className="pb-12">
          {/* 1. Board Editor Tab */}
          {activeTab === "board" && (
            <div className="space-y-4">
              {/* Game Basic Meta Bar */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400">اسم السهرة:</label>
                  <input
                    type="text"
                    value={pack.themeTitle}
                    onChange={(e) => setPack({ ...pack, themeTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-amber-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400">اسم العملة:</label>
                  <input
                    type="text"
                    value={pack.currencyName}
                    onChange={(e) => setPack({ ...pack, currencyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400">الثيم البصري:</label>
                  <select
                    value={pack.visualStyle}
                    onChange={(e) => setPack({ ...pack, visualStyle: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                  >
                    <option value="ANCIENT_ARABIA">عرب قديم / تاريخي 🏰</option>
                    <option value="CYBERPUNK">سايبربانك مستقبلي ⚡</option>
                    <option value="CARTOON_OFFICE">دوام ومكاتب كرتوني 🏢</option>
                    <option value="FANTASY">سحر وفانتازيا 🧙‍♂️</option>
                    <option value="SPACE">فضاء ومجرات 🚀</option>
                  </select>
                </div>
              </div>

              <BoardEditor
                tiles={pack.tiles}
                currencyName={pack.currencyName}
                onChangeTiles={(updatedTiles) => setPack({ ...pack, tiles: updatedTiles })}
              />
            </div>
          )}

          {/* 2. Cards Deck Editor Tab */}
          {activeTab === "cards" && (
            <CardDeckEditor
              cards={pack.cardsDeck}
              currencyName={pack.currencyName}
              onChangeCards={(updatedCards) => setPack({ ...pack, cardsDeck: updatedCards })}
            />
          )}

          {/* 3. Rules Engine Config Tab */}
          {activeTab === "rules" && (
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-cyan-400" />
                  ضبط محرك وقواعد اللعبة (Game Rules Config)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  هذه الخيارات تغير منطق السيرفر وشاشات اللاعبين والهواتف جذرياً في الوقت الفعلي
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Turn Mechanism */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Dices className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-black text-amber-300">ميكانيكية تعاقب الأدوار</span>
                  </div>
                  <select
                    value={rules.turnMechanism}
                    onChange={(e) =>
                      setPack({
                        ...pack,
                        rulesConfig: { ...rules, turnMechanism: e.target.value as TurnMechanism }
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-amber-400"
                  >
                    <option value="DICE_AND_MOVE">🎲 رمي النرد والمشي (كلاسيكي / مونوبولي)</option>
                    <option value="TERRITORY_COMMAND">⚔️ أوامر السيطرة العسكرية (بدون نرد / ريسك)</option>
                    <option value="CARD_PLAY_ONLY">🃏 لعب الأوراق التكتيكية فقط (أونو / باتلر)</option>
                    <option value="SOCIAL_DISCUSSION_VOTE">🗣️ حوار وتصويت جماعي (مافيا / جاسوس)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    يحدد ما إذا كان اللاعب يرمي النرد، أو يختار إقليماً عسكرياً، أو يكتفي بلعب بطاقته.
                  </p>
                </div>

                {/* Ownership System */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-black text-emerald-300">نظام ملكية الأراضي والعقارات</span>
                  </div>
                  <select
                    value={rules.ownershipSystem}
                    onChange={(e) =>
                      setPack({
                        ...pack,
                        rulesConfig: { ...rules, ownershipSystem: e.target.value as OwnershipSystem }
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-emerald-400"
                  >
                    <option value="NONE">بدون ملكية (لوحة عامة)</option>
                    <option value="BUY_AND_RENT">🏠 شراء عقارات وإيجارات تلقائية (مونوبولي)</option>
                    <option value="CONQUER_REGIONS">🛡️ احتلال أقاليم وجيوش دفاعية (ريسك)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    عند تفعيل الشراء والإيجار، يُخصم الإيجار تلقائياً لصالح مالك العقار عند وقوف أي لاعب عليه.
                  </p>
                </div>

                {/* Card Visibility */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-black text-indigo-300">سرية وعرض البطاقات</span>
                  </div>
                  <select
                    value={rules.cardVisibility}
                    onChange={(e) =>
                      setPack({
                        ...pack,
                        rulesConfig: { ...rules, cardVisibility: e.target.value as CardVisibility }
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-indigo-400"
                  >
                    <option value="SECRET_PHONE_ONLY">🔒 بطاقات سرية على جوال كل لاعب فقط</option>
                    <option value="OPEN_PUBLIC_CARDS">👁️ بطاقات مكشوفة للجميع (ألعاب النقاش)</option>
                    <option value="NO_HAND_CARDS">🚫 بدون بطاقات يد (تركيز على اللوحة)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    يتحكم في فلتر الخصوصية على السيرفر وما يراه كل لاعب في واجهته.
                  </p>
                </div>
              </div>

              {/* Win Conditions & Archetype */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">شرط الفوز الأساسي:</label>
                  <select
                    value={pack.winCondition || "MOST_COINS"}
                    onChange={(e) => setPack({ ...pack, winCondition: e.target.value as WinCondition })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-cyan-400"
                  >
                    <option value="MOST_COINS">أعلى رصيد بعد انتهاء الجولات</option>
                    <option value="FIRST_TO_FINISH">أول من يجتاز خط النهاية (المربع 19)</option>
                    <option value="TARGET_SCORE">أول من يصل لرصيد مستهدف محدد</option>
                    <option value="LAST_SURVIVOR">الناجي الوحيد بعد إفلاس أو إقصاء البقية</option>
                  </select>
                </div>

                {pack.winCondition === "TARGET_SCORE" && (
                  <div>
                    <label className="text-xs font-bold text-emerald-400 mb-1.5 block">الرصيد المستهدف للفوز:</label>
                    <input
                      type="number"
                      min={100}
                      max={1500}
                      step={50}
                      value={pack.targetScore || 400}
                      onChange={(e) => setPack({ ...pack, targetScore: parseInt(e.target.value, 10) || 400 })}
                      className="w-full bg-slate-950 border border-emerald-500 rounded-xl p-2 text-xs font-black text-emerald-400 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">الراوي ومقدمة السهرة:</label>
                  <input
                    type="text"
                    value={pack.narratorIntro}
                    onChange={(e) => setPack({ ...pack, narratorIntro: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 4. Export & Play Tab */}
          {activeTab === "export" && (
            <GamePackExporter
              pack={pack}
              onImportPack={(importedPack) => setPack(importedPack)}
            />
          )}
        </div>
      </main>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUserChanged={(u) => setCurrentUser(u)}
        onSelectGameToEdit={(g) => setPack(g.pack)}
        onSelectGameToPlay={(g) => {
          setPack(g.pack);
          handleLaunchGame();
        }}
      />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">🛠️</div>
          <p className="text-slate-400 text-sm">جاري تحميل استوديو الألعاب...</p>
        </div>
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}
