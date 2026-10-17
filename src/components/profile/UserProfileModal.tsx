"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Swords,
  Coins,
  Brain,
  Trophy,
  Play,
  LogOut,
  X,
  Lock,
  Mail,
  Layers,
  Globe,
  Sparkles,
  Flame,
  CheckCircle2
} from "lucide-react";
import type { UserAccount, SavedCustomGame } from "../../game/userStore";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: UserAccount | null) => void;
  onSelectGameToPlay?: (game: SavedCustomGame) => void;
  onSelectGameToEdit?: (game: SavedCustomGame) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  onUserChanged,
  onSelectGameToPlay,
  onSelectGameToEdit
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Load user from /api/auth/me on mount
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
          localStorage.setItem("boardgame_user_id", data.user.id);
          onUserChanged?.(data.user);
        } else {
          localStorage.removeItem("boardgame_user_token");
          localStorage.removeItem("boardgame_user_id");
        }
      })
      .catch(() => {});
  }, [onUserChanged]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: activeTab === "LOGIN" ? "login" : "register",
          usernameOrEmail: activeTab === "LOGIN" ? (username || email) : undefined,
          username: activeTab === "REGISTER" ? username : undefined,
          email: activeTab === "REGISTER" ? email : undefined,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل تسجيل الدخول");
      }

      localStorage.setItem("boardgame_user_token", data.token);
      localStorage.setItem("boardgame_user_id", data.user.id);
      setCurrentUser(data.user);
      onUserChanged?.(data.user);
      setPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("boardgame_user_token");
    localStorage.removeItem("boardgame_user_id");
    setCurrentUser(null);
    onUserChanged?.(null);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {currentUser ? "الملف الشخصي والبصمة السلوكية" : "حساب اللاعب والذكاء الاصطناعي"}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentUser
                    ? "يتعلم النظام ذاتياً من قراراتك لبناء هويتك التنافسية"
                    : "سجّل دخولك لحفظ ألعابك وتطوير شخصيتك في ذاكرة الشلة"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {currentUser ? (
              /* LOGGED IN VIEW */
              <div className="space-y-6">
                {/* User Info Bar */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-4">
                    <div
                      style={{ backgroundColor: currentUser.avatarColor || "#EF4444" }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-950 shadow-md"
                    >
                      {currentUser.username.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {currentUser.username}
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          حساب نشط
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">{currentUser.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-900/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    خروج
                  </button>
                </div>

                {/* AI Behavioral DNA Card */}
                <div className="p-5 bg-gradient-to-br from-indigo-950/60 via-slate-950 to-purple-950/40 rounded-2xl border border-indigo-500/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <h4 className="font-extrabold text-base text-indigo-200">
                        البصمة السلوكية المستمرة (Player Behavioral DNA)
                      </h4>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-black border border-indigo-500/30">
                      {currentUser.dna.archetypeTitle}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    يحلل الذكاء الاصطناعي كل قرار تتخذه أثناء اللعب (الشراء، الهجوم، الغدر، والتصويت) لتوليد بطاقات وتحديات مفصلة على أسلوبك الشخصي:
                  </p>

                  {/* 4 Score Progress Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Aggression */}
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1 text-rose-300">
                          <Swords className="w-3.5 h-3.5" />
                          النزعة الهجومية
                        </span>
                        <span className="text-rose-400">{currentUser.dna.aggressionScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, currentUser.dna.aggressionScore)}%` }}
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Capitalist */}
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Coins className="w-3.5 h-3.5" />
                          الدهاء الرأسمالي
                        </span>
                        <span className="text-amber-400">{currentUser.dna.capitalistScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, currentUser.dna.capitalistScore)}%` }}
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Tactical Cards */}
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1 text-indigo-300">
                          <Layers className="w-3.5 h-3.5" />
                          المكر التكتيكي
                        </span>
                        <span className="text-indigo-400">{currentUser.dna.tacticalCardScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, currentUser.dna.tacticalCardScore)}%` }}
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Social Voter */}
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-1 text-cyan-300">
                          <Shield className="w-3.5 h-3.5" />
                          الدبلوماسية والمجلس
                        </span>
                        <span className="text-cyan-400">{currentUser.dna.socialVoterScore}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, currentUser.dna.socialVoterScore)}%` }}
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-900/40 text-center">
                    <div className="p-2 bg-slate-950/60 rounded-xl">
                      <div className="text-[10px] text-slate-400">الجلسات الملعوبة</div>
                      <div className="text-base font-black text-white">{currentUser.dna.gamesPlayed}</div>
                    </div>
                    <div className="p-2 bg-slate-950/60 rounded-xl">
                      <div className="text-[10px] text-slate-400">مرات الفوز 🏆</div>
                      <div className="text-base font-black text-amber-400">{currentUser.dna.winsCount}</div>
                    </div>
                    <div className="p-2 bg-slate-950/60 rounded-xl">
                      <div className="text-[10px] text-slate-400">نسبة الفوز</div>
                      <div className="text-base font-black text-emerald-400">
                        {currentUser.dna.gamesPlayed > 0
                          ? `${Math.round((currentUser.dna.winsCount / currentUser.dna.gamesPlayed) * 100)}%`
                          : "0%"}
                      </div>
                    </div>
                  </div>

                  {/* Nemesis Clash Map */}
                  {Object.keys(currentUser.dna.nemesisMap || {}).length > 0 && (
                    <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-900/40 space-y-1">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        سجل الخصومات والتصويت العدائي:
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(currentUser.dna.nemesisMap).map(([rival, clashes]) => (
                          <span
                            key={rival}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800"
                          >
                            الخصم <strong className="text-rose-400">{rival}</strong> ({clashes} مواجهة)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* My Saved Games Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      ألعابي المحفوظة ({currentUser.myGames?.length || 0})
                    </h4>
                  </div>

                  {(!currentUser.myGames || currentUser.myGames.length === 0) ? (
                    <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                      <p className="text-sm text-slate-400">لم تقم بحفظ أي ألعاب بعد.</p>
                      <p className="text-xs text-slate-500">
                        صمم ألعابك الخاصة في استوديو التصميم واحفظها هنا لتلعبها في أي وقت!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentUser.myGames.map((game) => (
                        <div
                          key={game.id}
                          className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  game.visibility === "PUBLIC"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {game.visibility === "PUBLIC" ? "🌐 عام في المجتمع" : "🔒 خاص بي"}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold">
                                {game.pack.visualStyle}
                              </span>
                            </div>
                            <h5 className="font-black text-white text-base mt-2 line-clamp-1">
                              {game.pack.themeTitle}
                            </h5>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                              {game.pack.narratorIntro}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-900 gap-2">
                            <span className="text-[11px] text-slate-500">
                              ❤️ {game.likesCount} · 🎲 {game.playsCount}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {onSelectGameToEdit && (
                                <button
                                  onClick={() => {
                                    onSelectGameToEdit(game);
                                    onClose();
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                  تعديل
                                </button>
                              )}
                              {onSelectGameToPlay && (
                                <button
                                  onClick={() => {
                                    onSelectGameToPlay(game);
                                    onClose();
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1 transition-colors"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  العب
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* LOGIN / REGISTER VIEW */
              <div className="space-y-6 max-w-md mx-auto py-4">
                {/* Tab Switcher */}
                <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => {
                      setActiveTab("LOGIN");
                      setErrorMsg(null);
                    }}
                    className={`py-2.5 rounded-xl text-sm font-black transition-all ${
                      activeTab === "LOGIN"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("REGISTER");
                      setErrorMsg(null);
                    }}
                    className={`py-2.5 rounded-xl text-sm font-black transition-all ${
                      activeTab === "REGISTER"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    حساب جديد
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-center text-xs font-bold text-rose-300">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {activeTab === "REGISTER" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">اسم المستخدم</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="مثال: سلطان"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-3 text-sm text-white focus:border-amber-400 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      {activeTab === "LOGIN" ? "اسم المستخدم أو البريد الإلكتروني" : "البريد الإلكتروني"}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                      <input
                        type={activeTab === "LOGIN" ? "text" : "email"}
                        required
                        value={activeTab === "LOGIN" ? (username || email) : email}
                        onChange={(e) => {
                          if (activeTab === "LOGIN") {
                            setUsername(e.target.value);
                            setEmail(e.target.value);
                          } else {
                            setEmail(e.target.value);
                          }
                        }}
                        placeholder={activeTab === "LOGIN" ? "اسمك أو بريدك" : "name@example.com"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-3 text-sm text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">كلمة المرور</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-3 text-sm text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 shadow-lg"
                  >
                    {isLoading ? "جاري المعالجة..." : activeTab === "LOGIN" ? "دخول" : "إنشاء حساب وبدء البصمة"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
