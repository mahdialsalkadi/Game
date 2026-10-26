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
  Plus,
  Users,
  Eye,
  Tv,
  Smartphone,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Heart
} from "lucide-react";
import UserProfileModal from "@/components/profile/UserProfileModal";
import type { UserAccount, SavedCustomGame } from "@/game/userStore";
import { JAWAKER_LOUNGE_GAMES, COMMUNITY_MAPS } from "@/components/studio/presets";

export default function HomePage() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [creatingGameKey, setCreatingGameKey] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isJoinDrawerOpen, setIsJoinDrawerOpen] = useState(false);
  const [viewCategory, setViewCategory] = useState<"ALL" | "BASE" | "COMMUNITY">("ALL");

  // Community Games
  const [communityGames, setCommunityGames] = useState<SavedCustomGame[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [likedGameIds, setLikedGameIds] = useState<string[]>([]);
  const [pendingCommunityAction, setPendingCommunityAction] = useState<string | null>(null);

  // Check login on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawLikes = localStorage.getItem("boardgame_liked_games");
      if (rawLikes) {
        const parsed = JSON.parse(rawLikes);
        if (Array.isArray(parsed)) setLikedGameIds(parsed.filter((id) => typeof id === "string"));
      }
    } catch {}

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

  const handleLikeCommunityGame = async (gameId: string) => {
    if (pendingCommunityAction) return;
    const isCurrentlyLiked = likedGameIds.includes(gameId);
    setPendingCommunityAction(`LIKE:${gameId}`);
    try {
      const res = await fetch("/api/community", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          action: isCurrentlyLiked ? "UNLIKE" : "LIKE"
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.game) {
        throw new Error(data.error || "تعذر تحديث الإعجاب");
      }
      setCommunityGames((prev) =>
        prev.map((game) =>
          game.id === gameId ? { ...game, likesCount: data.game.likesCount } : game
        )
      );
      setLikedGameIds((prev) => {
        const next = isCurrentlyLiked
          ? prev.filter((id) => id !== gameId)
          : [...prev, gameId];
        try {
          localStorage.setItem("boardgame_liked_games", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      console.error("Failed to update community like:", err);
    } finally {
      setPendingCommunityAction(null);
    }
  };

  const handlePlayCommunityGame = (game: SavedCustomGame) => {
    // سجّل اللعب فوراً ثم افتح غرفة الحزمة؛ لا نعطّل الانتقال بانتظار الشبكة.
    setCommunityGames((prev) =>
      prev.map((item) =>
        item.id === game.id ? { ...item, playsCount: (item.playsCount || 0) + 1 } : item
      )
    );
    void fetch("/api/community", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id, action: "PLAY" })
    }).catch((err) => console.error("Failed to record community play:", err));

    handleCreateRoom(undefined, false, game.pack);
  };

  const handleCreateRoom = async (presetKey?: string, autoBots?: boolean, customPack?: any) => {
    try {
      setIsCreating(true);
      setCreatingGameKey(presetKey || "DEFAULT");
      if (typeof window !== "undefined") {
        if (customPack) {
          sessionStorage.setItem("custom_studio_pack", JSON.stringify(customPack));
        } else {
          // A room created from a classic/community preset must not inherit
          // the custom pack of a previous studio session.
          sessionStorage.removeItem("custom_studio_pack");
        }
      }
      const res = await fetch("/api/rooms", { method: "POST" });
      const data = await res.json();
      if (data.success && data.roomId) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`host_token_${data.roomId}`, data.hostToken);
        }
        const sp = new URLSearchParams();
        if (presetKey) sp.set("preset", presetKey);
        if (autoBots) sp.set("autoBots", "true");
        const q = sp.toString() ? `?${sp.toString()}` : "";
        router.push(`/host/${data.roomId}${q}`);
      }
    } catch (err) {
      console.error("Failed to create room via API, falling back:", err);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const sp = new URLSearchParams();
      if (presetKey) sp.set("preset", presetKey);
      if (autoBots) sp.set("autoBots", "true");
      const q = sp.toString() ? `?${sp.toString()}` : "";
      router.push(`/host/${code}${q}`);
    } finally {
      setIsCreating(false);
      setCreatingGameKey(null);
    }
  };

  const handleJoin = (role: "PLAYER" | "SPECTATOR") => {
    if (!roomCode || roomCode.length < 4) return;
    if (role === "PLAYER") {
      router.push(`/join?room=${roomCode}`);
    } else {
      router.push(`/room/${roomCode}?role=SPECTATOR`);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 bg-mesh-dark text-white flex flex-col font-sans select-none relative overflow-x-hidden"
    >
      {/* Luxury Lounge Navbar */}
      <header className="border-b border-amber-500/20 glass-panel px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-200/50">
            🎲
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>صالة ألعاب المجلس</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 font-black">
                Jawaker Edition · VIP 2.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              شاشة التلفزيون الكبيرة + تحكم كامل ونرد ثلاثي الأبعاد من جوال كل لاعب 📱
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsJoinDrawerOpen(!isJoinDrawerOpen)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-black transition-all shadow"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>رمز الغرفة 📱</span>
          </button>

          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-black text-xs transition-all shadow"
          >
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <span>استوديو AI 🎨</span>
          </Link>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-amber-400 text-xs font-bold transition-all shadow"
          >
            <Brain className="w-4 h-4" />
            {currentUser ? (
              <span className="text-white font-bold">{currentUser.username} (DNA)</span>
            ) : (
              <span>دخول / بصمة اللاعب</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Hub Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            سهرة المجلس التفاعلية الأصلية بأحدث تقنيات الويب والذكاء الاصطناعي
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            الشاشة الكبيرة تجمعكم في المجلس..
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent drop-shadow">
              وجوالاتكم هي نردكم وبطاقاتكم وعباراتكم الساخرة!
            </span>
          </h2>
          <p className="text-slate-300 text-base max-w-3xl mx-auto leading-relaxed">
            محرك تفاعلي يجمع 9 ألعاب كلاسيكية عالمية بنكهة عربية أصيلة: احتكار عقارات الرياض، صليب لودو الأصلي ونجوم الأمان، طاولة كروت أونو الخضراء، شبكة السلم والثعبان 100، غزو العالم، مافيا الشلة، كونكت فور، الضامة، وبينغو السهرة.
          </p>
        </div>

        {/* Quick Join Drawer / Bar */}
        <section className="max-w-3xl mx-auto w-full bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 border-2 border-emerald-500/30 hover:border-emerald-500/60 rounded-3xl p-6 shadow-[0_0_35px_rgba(16,185,129,0.15)] transition-all">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-right">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                📱
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>انضمام فوري إلى غرفة موجودة</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    رمز 4 أحرف
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  ادخل الرمز المعروض على شاشة المضيف لتتحكم وتلعب أو تشاهد الجلسة مباشرة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
                className="w-28 md:w-32 text-center text-2xl font-black tracking-widest bg-slate-950 border-2 border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-2xl py-2.5 outline-none uppercase text-white shadow-inner font-mono"
              />
              <button
                disabled={roomCode.length < 4}
                onClick={() => handleJoin("PLAYER")}
                className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                title="دخول كلاعيب"
              >
                <Users className="w-4 h-4" />
                <span>دخول لاعب 🎮</span>
              </button>
              <button
                disabled={roomCode.length < 4}
                onClick={() => handleJoin("SPECTATOR")}
                className="px-3.5 py-3 rounded-2xl text-xs font-black bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 flex items-center gap-1"
                title="دخول كمتفرج للمشاهدة فقط"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">متفرج 👁️</span>
              </button>
            </div>
          </div>
        </section>

        {/* Main Category Switcher (الألعاب الأصلية vs مابات المجتمع) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-xl mx-auto p-1.5 rounded-3xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-md shadow-2xl">
          <button
            onClick={() => setViewCategory("ALL")}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              viewCategory === "ALL"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg scale-[1.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🌟</span>
            <span>عرض الكل</span>
          </button>
          <button
            onClick={() => setViewCategory("BASE")}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              viewCategory === "BASE"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg scale-[1.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🏛️</span>
            <span>الألعاب الأصلية (Base)</span>
          </button>
          <button
            onClick={() => setViewCategory("COMMUNITY")}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              viewCategory === "COMMUNITY"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-[1.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🌐</span>
            <span>مابات المجتمع (Mods)</span>
          </button>
        </div>

        {/* SECTION 1: Base Classic Games Showcase */}
        {(viewCategory === "ALL" || viewCategory === "BASE") && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>🏛️</span>
                  <span>ألعاب صالة المجلس الرسمية (الألعاب الكلاسيكية الأصلية)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  النسخ العالمية الأصلية لجميع الألعاب بقوانينها الثابتة: مونوبولي أتلانتيك سيتي بالدولار، صليب لودو 15x15، كروت أونو الخضراء، شبكة السلم 100، غزو العالم، مافيا الشلة، كونكت فور، الضامة، وبينغو السهرة.
                </p>
              </div>

              <Link
                href="/studio"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all"
              >
                <span>فتح استوديو التعديل الكامل</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {JAWAKER_LOUNGE_GAMES.map((game) => {
                const isThisCreating = isCreating && creatingGameKey === game.key;

                return (
                  <div
                    key={game.key}
                    className={`rounded-3xl border-2 p-5 flex flex-col justify-between space-y-4 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl bg-gradient-to-br ${game.colorScheme.bgGradient} ${game.colorScheme.border} ${game.colorScheme.glow} group relative overflow-hidden`}
                  >
                    {/* Card Cover Art & Badge */}
                    <div className="space-y-3">
                      <div className="relative -mx-5 -mt-5 mb-1 h-40 overflow-hidden rounded-t-[22px] border-b border-white/10">
                        <img
                          src={game.cover}
                          alt={game.titleAr}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                        <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-950/85 border border-white/20 backdrop-blur flex items-center justify-center text-2xl shadow-xl">
                            {game.icon}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border backdrop-blur ${game.colorScheme.badgeBg}`}>
                              {game.badge}
                            </span>
                            <span className="text-[10px] text-white/80 font-bold bg-slate-950/70 border border-white/10 rounded-full px-2 py-0.5">
                              {game.playerCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                          {game.titleAr}
                        </h4>
                        <p className="text-xs text-amber-300/90 font-bold mt-0.5">
                          {game.subtitleAr}
                        </p>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {game.descriptionAr}
                      </p>

                      {/* Authentic Features Pills */}
                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/10">
                        {game.features.map((feat, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] text-slate-200 bg-slate-950/60 border border-white/5 rounded-lg px-2 py-1 flex items-center gap-1 truncate"
                          >
                            <span className="text-emerald-400 font-black">✓</span>
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: Instant Bots vs Host Room */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex gap-2">
                        {/* 1-Click Instant Solo/Bot Match */}
                        <button
                          disabled={isCreating}
                          onClick={() => handleCreateRoom(game.key, true)}
                          className="flex-1 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 glow-amber"
                          title="شاهد عرضاً تجريبياً فورياً مع 3 بوتات ذكية — انضم من جوالك للعب بنفسك"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isThisCreating ? "جاري التشغيل..." : "عرض تجريبي مع بوتات 🤖"}</span>
                        </button>

                        {/* Create Room for Friends (Multi-Device with QR) */}
                        <button
                          disabled={isCreating}
                          onClick={() => handleCreateRoom(game.key, false)}
                          className="px-3.5 py-3 rounded-2xl text-xs font-black bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 hover:border-amber-400/50 flex items-center justify-center gap-1 transition-all shadow active:scale-95"
                          title="أنشئ غرفة شاشة لعرض الكود للأصدقاء"
                        >
                          <Tv className="w-3.5 h-3.5 text-indigo-400" />
                          <span>أنشئ غرفة 👥</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>{game.rulesPreview.mechanism}</span>
                        <Link
                          href={`/studio?preset=${game.key}`}
                          className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 flex items-center gap-0.5"
                        >
                          تعديل القواعد 🎨
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: Community Maps & Mods Shelf */}
        {(viewCategory === "ALL" || viewCategory === "COMMUNITY") && (
          <section className="space-y-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner">
                  🌐
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <span>مابات وخرائط المجتمع المضافة</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Community Mods & Maps
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    عوالم وخرائط مبتكرة صممها مجتمع اللاعبين وصنّاع المحتوى (عقارات الرياض الفاخرة، سايبربانك 2088، فضاء النجوم، ممالك الفرسان، وبازار الحرير)
                  </p>
                </div>
              </div>

              <Link
                href="/studio"
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/50 text-indigo-200 transition-colors shadow"
              >
                <Plus className="w-4 h-4" />
                <span>انشر مابك الخاص 🚀</span>
              </Link>
            </div>

            {/* Curated Official Community Maps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COMMUNITY_MAPS.map((map) => {
                const isThisCreating = isCreating && creatingGameKey === map.presetKey;

                return (
                  <div
                    key={map.id}
                    className={`rounded-3xl border-2 p-5 flex flex-col justify-between space-y-4 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl bg-gradient-to-br ${map.colorScheme.bgGradient} ${map.colorScheme.border} ${map.colorScheme.glow} group relative overflow-hidden`}
                  >
                    {/* Card Top: Badge & Creator & Rating */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${map.colorScheme.badgeBg}`}>
                          {map.badge}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-amber-300 font-bold">⭐ {map.rating}</span>
                          <span className="text-[10px] text-slate-400">({map.downloadsCount.toLocaleString()} لاعب)</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-indigo-300 font-bold mb-1 flex items-center gap-1">
                          <span>بواسطة:</span>
                          <strong className="text-white">{map.creatorAr}</strong>
                          <span className="text-amber-400 text-[9px] px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/20">{map.creatorBadgeAr}</span>
                        </div>
                        <h4 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                          {map.titleAr}
                        </h4>
                        <p className="text-xs text-amber-200/90 font-bold mt-0.5">
                          {map.subtitleAr}
                        </p>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {map.descriptionAr}
                      </p>

                      {/* Highlights */}
                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/10">
                        {map.highlights.map((feat, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] text-slate-200 bg-slate-950/60 border border-white/5 rounded-lg px-2 py-1 flex items-center gap-1 truncate"
                          >
                            <span className="text-emerald-400 font-black">✓</span>
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex gap-2">
                        <button
                          disabled={isCreating}
                          onClick={() => handleCreateRoom(map.presetKey, true)}
                          className="flex-1 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-400 text-white flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95"
                          title="العب هذا الماب فوراً مع بوتات ذكية"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isThisCreating ? "جاري التشغيل..." : "العب هذا الماب 🤖"}</span>
                        </button>

                        <button
                          disabled={isCreating}
                          onClick={() => handleCreateRoom(map.presetKey, false)}
                          className="px-3.5 py-3 rounded-2xl text-xs font-black bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 hover:border-indigo-400/50 flex items-center justify-center gap-1 transition-all shadow active:scale-95"
                          title="أنشئ غرفة لأصدقائك في هذا الماب"
                        >
                          <Tv className="w-3.5 h-3.5 text-indigo-400" />
                          <span>أنشئ غرفة 👥</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>العملة: {map.rulesPreview.currency}</span>
                        <Link
                          href={`/studio?preset=${map.presetKey}`}
                          className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 flex items-center gap-0.5"
                        >
                          تعديل الماب 🎨
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extra User Uploaded Games from Database (if any exist) */}
            {communityGames.length > 0 && (
              <div className="pt-6 border-t border-slate-800/60 space-y-3">
                <h4 className="text-sm font-black text-slate-300 flex items-center gap-2">
                  <span>✨</span>
                  <span>إبداعات إضافية من مجتمع اللاعبين المسجلين:</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communityGames.map((game) => {
                    const isLiked = likedGameIds.includes(game.id);
                    const isLiking = pendingCommunityAction === `LIKE:${game.id}`;
                    return (
                    <div
                      key={game.id}
                      className="glass-card hover:border-indigo-400/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
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

                        <h4 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {game.pack.themeTitle}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {game.pack.narratorIntro}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                        <span className="text-xs text-slate-400 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleLikeCommunityGame(game.id)}
                            disabled={isLiking}
                            title={isLiked ? "إزالة الإعجاب" : "أعجبني"}
                            className={`flex items-center gap-1 font-bold transition-colors disabled:opacity-50 ${
                              isLiked ? "text-rose-400" : "hover:text-rose-300"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-400" : ""}`} />
                            <span>{game.likesCount}</span>
                          </button>
                          <span>🎲 {game.playsCount} لعب</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/studio?remixId=${game.id}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          >
                            تعديل (Remix)
                          </Link>
                          <button
                            onClick={() => handlePlayCommunityGame(game)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-1 transition-all shadow-md active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            العب
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 px-6 py-8 pb-16 text-center text-xs text-slate-500 space-y-1">
        <div>صالة ألعاب المجلس — Jawaker-Style Universal Board & Card Game Platform & Lounge</div>
        <div className="text-[10px] text-slate-600">
          محرك قواعد حقيقي متعدد الأنواع · نرد ثلاثي الأبعاد وهابتكس · ذكاء اصطناعي سلوكي متطور
        </div>
      </footer>

      {/* User Profile & DNA Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUserChanged={(u) => setCurrentUser(u)}
        onSelectGameToPlay={(g) => handleCreateRoom(undefined, false, g.pack)}
        onSelectGameToEdit={(g) => router.push(`/studio?gameId=${g.id}`)}
      />
    </div>
  );
}
