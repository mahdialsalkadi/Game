"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileCode,
  Sparkles,
  Layers,
  Grid
} from "lucide-react";
import { GeneratedSessionPackSchema } from "@/game/schema";
import type { GeneratedSessionPack } from "@/game/schema";

interface GamePackExporterProps {
  pack: GeneratedSessionPack;
  onImportPack: (pack: GeneratedSessionPack) => void;
}

export default function GamePackExporter({
  pack,
  onImportPack
}: GamePackExporterProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Validate current pack
  const validationResult = GeneratedSessionPackSchema.safeParse(pack);
  const isValid = validationResult.success;
  const validationErrors = !isValid
    ? validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
    : [];

  // 1. Export JSON
  const handleExportJson = () => {
    try {
      const dataStr = JSON.stringify(pack, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = (pack.themeTitle || "game-pack")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-");
      link.href = url;
      link.download = `${safeTitle || "game-pack"}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("حدث خطأ أثناء تصدير الملف.");
    }
  };

  // 2. Import JSON
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const parsed = GeneratedSessionPackSchema.safeParse(json);
      if (!parsed.success) {
        const errorList = parsed.error.errors
          .map((e) => `• ${e.path.join(".")}: ${e.message}`)
          .slice(0, 5)
          .join("\n");
        setImportError(
          `الملف المرفوع لا يتطابق مع معايير اللعبة المعتمدة:\n${errorList}`
        );
        return;
      }

      onImportPack(parsed.data);
      setImportSuccess(
        `تم استيراد حزمة "${parsed.data.themeTitle}" بنجاح (${parsed.data.tiles.length} مربعاً و ${parsed.data.cardsDeck.length} بطاقة)!`
      );
    } catch (err: any) {
      console.error("Import error:", err);
      setImportError("صيغة الملف غير صالحة. يرجى التأكد من رفع ملف JSON سليم.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 3. Try Game Now
  const handlePlayNow = async () => {
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
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(pack, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {importSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs sm:text-sm font-bold">{importSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setImportSuccess(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            إغلاق
          </button>
        </div>
      )}

      {importError && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold mb-1">خطأ في استيراد الملف</h4>
            <pre className="text-xs text-rose-300 font-mono whitespace-pre-wrap">
              {importError}
            </pre>
          </div>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="text-xs text-rose-400 hover:text-white"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Primary Actions Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Export Button Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">تصدير الحزمة</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              قم بتحميل حزمة اللعبة كملف <code className="text-amber-300 font-mono">game-pack.json</code> لمشاركتها أو استخدامها لاحقاً.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 hover:border-emerald-500 transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير كملف JSON</span>
          </button>
        </div>

        {/* Import Button Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">استيراد حزمة</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ارفع ملف JSON لحزمة سبق تصميمها أو مولدة عبر الذكاء الاصطناعي لفحصها وتعديلها.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 hover:border-blue-500 transition-all shadow-md"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>استيراد ملف JSON</span>
          </button>
        </div>

        {/* Play Now Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/60 to-slate-900/90 border border-purple-500/40 flex flex-col justify-between gap-4 shadow-xl shadow-purple-950/20">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Play className="w-6 h-6 fill-amber-400" />
            </div>
            <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
              <span>جرّب اللعبة الآن</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                جاهزة
              </span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              احفظ هذه الحزمة في جلسة المتصفح وانتقل إلى الشاشة الرئيسية لإنشاء الغرفة ولعبها مع الشلة!
            </p>
          </div>

          <button
            type="button"
            onClick={handlePlayNow}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-purple-600 hover:from-amber-300 hover:to-purple-500 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transform hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span>جرّب اللعبة الآن 🎲</span>
          </button>
        </div>
      </div>

      {/* Validation Status & Summary */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                isValid
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              {isValid ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {isValid
                  ? "الحزمة مطابقة لمعايير المحرك 100%"
                  : "تنبيه: توجد حقول تحتاج مراجعة في الحزمة"}
              </h4>
              <p className="text-xs text-slate-400">
                {isValid
                  ? "تم فحص الحزمة عبر GeneratedSessionPackSchema وهي صالحة للبدء الفوري."
                  : "يرجى مراجعة الملاحظات أدناه لضمان توازن عمل المحرك."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono">
              المربعات: {pack.tiles.length} / 20
            </span>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono">
              البطاقات: {pack.cardsDeck.length} / 25
            </span>
          </div>
        </div>

        {!isValid && validationErrors.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 space-y-1">
            {validationErrors.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block mb-1">اسم العملة</span>
            <span className="font-bold text-white text-sm">
              {pack.currencyName}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block mb-1">نمط اللعبة</span>
            <span className="font-bold text-amber-300 text-sm">
              {pack.archetype}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block mb-1">شرط الفوز</span>
            <span className="font-bold text-purple-300 text-sm">
              {pack.winCondition}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-500 block mb-1">النمط البصري</span>
            <span className="font-bold text-cyan-300 text-sm">
              {pack.visualStyle}
            </span>
          </div>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-200">
              معاينة كود الـ JSON النهائي
            </h4>
          </div>

          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الكود</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre
            dir="ltr"
            className="w-full max-h-80 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-300 font-mono text-xs leading-relaxed"
          >
            {JSON.stringify(pack, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
