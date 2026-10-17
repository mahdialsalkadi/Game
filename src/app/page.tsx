"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Wand2,
  Brain,
  Globe,
  Heart,
  Layers,
  ArrowRight,
  Flame,
  Shield,
  Coins,
  Swords,
  Plus
} from "lucide-react";
import UserProfileModal from "@/components/profile/UserProfileModal";
import type { UserAccount, SavedCustomGame } from "@/game/userStore";
import { STUDIO_PRESETS, PRESET_PACKS } from "@/components/studio/presets";

export default function HomePage() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Community Games
  const [communityGames, setCommunityGames] = useState<SavedCustomGame[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  // Check login on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("boardgame_user_token");
    if (!token) return;

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Fetch community games
  const loadCommunityGames = async () => {
    setIsLoadingCommunity(true);
    try {
      const res = await fetch("/api/community");
      const data = await res.json();
      if (data.games) {
        setCommunityGames(data.games);
      }
    } catch (err) {
      console.error("Failed to fetch community games:", err);
    } finally {
      setIsLoadingCommunity(false);
    }
  };

  useEffect(() => {
    loadCommunityGames();
  }, []);

  const handleCreateRoom = async (presetPack?: any) => {
    try {
      setIsCreating(true);
      if (presetPack && typeof window !== "undefined") {
        sessionStorage.setItem("custom_studio_pack", JSON.stringify(presetPack));
      }
      const res = await fetch("/api/rooms", { method: "POST" });
      const data = await res.json();
      if (data.success && data.roomId) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`host_token_${data.roomId}`, data.hostToken);
        }
        router.push(`/host/${data.roomId}`);
      }
    } catch (err) {
      console.error("Failed to create room via API, falling back:", err);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      router.push(`/host/${code}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none"
    >
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎲</span>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">منصة واستوديو ألعاب الطاولة العالمية</h1>
            <p className="text-[11px] text-slate-400">محرك قواعد متعدد · ذكاء اصطناعي سلوكي · مكتبة مجتمع</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs hover:opacity-90 shadow-md transition-all"
          >
            <Wand2 className="w-4 h-4" />
            استوديو التصميم 🛠️
          </Link>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold transition-colors"
          >
            <Brain className="w-4 h-4" />
            {currentUser ? (
              <span className="text-white font-bold">{currentUser.username} (DNA)</span>
            ) : (
              <span>دخول / البصمة السلوكية</span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-8 space-y-12">
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            الجيل الجديد من ألعاب السهرة التفاعلية بالذكاء الاصطناعي
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            العب مع أصدقائك من الشاشة الكبيرة..
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              بتحكم كامل من جوال كل لاعب وبصمة ذكية تتعلم أسلوبك!
            </span>
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            محرك يدعم 6 ميكانيكيات عالمية: شراء العقارات وإيجارات مونوبولي، احتلال دول ريسك بدون نرد، حرب كروت أونو، سوالف ومافيا، وسباق السلم والثعبان.
          </p>
        </div>

        {/* Quick Launch & Join Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Host New Room */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4 transition-all">
            <div className="space-y-2">
              <span className="text-2xl">🏠</span>
              <h3 className="text-xl font-black text-white">شاشة التلفزيون (المضيف)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                أنشئ غرفة جديدة واعرض لوحة اللعبة على الشاشة الكبيرة أو اللابتوب ليقوم أصدقاؤك بمسح الـ QR بجوالاتهم.
              </p>
            </div>
            <button
              disabled={isCreating}
              onClick={() => handleCreateRoom()}
              className="w-full py-4 rounded-2xl text-base font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-xl active:scale-95 transition-all"
            >
              {isCreating ? "جاري إنشاء الغرفة..." : "أنشئ غرفة سهرة جديدة 🚀"}
            </button>
          </div>

          {/* Join from Mobile */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4 transition-all">
            <div className="space-y-2">
              <span className="text-2xl">📱</span>
              <h3 className="text-xl font-black text-white">انضمام من الجوال (لاعب)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ادخل رمز الغرفة المكون من 4 أحرف للتحكم بحركاتك وبطاقاتك السرية والتصويت من جوالك.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="رمز الغرفة"
                maxLength={4}
                className="flex-1 text-center text-xl font-black tracking-widest bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3.5 focus:border-emerald-400 outline-none uppercase"
              />
              <button
                disabled={roomCode.length < 4}
                onClick={() => router.push(`/join?room=${roomCode}`)}
                className="px-6 rounded-2xl text-base font-bold bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
              >
                ادخل
              </button>
            </div>
          </div>
        </div>

        {/* 6 Famous Game Presets Shelf */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>🏆</span>
                الألعاب العالمية الجاهزة للعب الفوري أو التعديل
              </h3>
              <p className="text-xs text-slate-400">انقر للعب المباشر على التلفزيون، أو عدّل القواعد في الاستوديو</p>
            </div>
            <Link
              href="/studio"
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              افتح الاستوديو الكامل
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(STUDIO_PRESETS).map(([key, item]) => {
              const pack = PRESET_PACKS[key];
              return (
                <div
                  key={key}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:scale-102 shadow-lg"
                >
                  <div className="space-y-1">
                    <span className="text-2xl">{item.icon || "🎲"}</span>
                    <h4 className="font-black text-sm text-white line-clamp-1">{item.label}</h4>
                    <span className="text-[10px] font-bold text-amber-400/90 block">{item.pack.visualStyle}</span>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{item.pack.narratorIntro}</p>
                  </div>

                  <div className="flex gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleCreateRoom(pack)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      العب
                    </button>
                    <Link
                      href={`/studio?preset=${key}`}
                      className="px-2 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="تعديل في الاستوديو"
                    >
                      تعديل
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Community Games Hub Shelf */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-xl font-black text-white">مكتبة المجتمع والألعاب المنشورة (Community Hub)</h3>
                <p className="text-xs text-slate-400">ألعاب صممها ونشرها اللاعبون بالذكاء الاصطناعي لتلعبها مع شلتك</p>
              </div>
            </div>
            <Link
              href="/studio"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              انشر لعبتك الخاصة
            </Link>
          </div>

          {communityGames.length === 0 ? (
            <div className="p-8 bg-slate-900/60 rounded-3xl border border-slate-800 text-center space-y-3">
              <div className="text-3xl">🌐</div>
              <h4 className="text-base font-bold text-white">كن أول من ينشر لعبة في مكتبة المجتمع!</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                ادخل إلى استوديو التصميم، اختر قالباً أو ثيماً واضغط "نشر في المجتمع" ليظهر إبداعك لجميع اللاعبين.
              </p>
              <Link
                href="/studio"
                className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-colors"
              >
                صمم وانشر أول لعبة الآن 🚀
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:scale-[1.01] shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {game.pack.visualStyle}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        بواسطة: <strong className="text-slate-200">{game.authorName}</strong>
                      </span>
                    </div>

                    <h4 className="text-base font-black text-white line-clamp-1">
                      {game.pack.themeTitle}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {game.pack.narratorIntro}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      <span>❤️ {game.likesCount}</span>
                      <span>🎲 {game.playsCount} لعب</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/studio?remixId=${game.id}`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        تعديل (Remix)
                      </Link>
                      <button
                        onClick={() => handleCreateRoom(game.pack)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 flex items-center gap-1 transition-opacity"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        العب
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-6 text-center text-xs text-slate-600">
        منصة واستوديو ألعاب الطاولة والورق العالمية — Universal Board & Card Game Platform & Maker
      </footer>

      {/* User Profile & DNA Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUserChanged={(u) => setCurrentUser(u)}
        onSelectGameToPlay={(g) => handleCreateRoom(g.pack)}
        onSelectGameToEdit={(g) => router.push(`/studio?gameId=${g.id}`)}
      />
    </div>
  );
}
