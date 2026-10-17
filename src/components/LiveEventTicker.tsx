"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Radio, Zap } from "lucide-react";

export interface LiveEventTickerProps {
  events: string[];
  className?: string;
}

/**
 * LiveEventTicker
 * شريط الأخبار العاجلة التفاعلي في أسفل شاشة اللعبة المشتركة.
 * يعرض آخر 5 أحداث ومفاجآت في السهرة مع حركة انزلاقية لا نهائية وشارة عاجل النارية المتوهجة.
 */
export default function LiveEventTicker({
  events,
  className = ""
}: LiveEventTickerProps) {
  // أحدث 5 أحداث من سجل اللعبة
  const latestEvents = useMemo(() => {
    if (!events || events.length === 0) {
      return [
        "أهلاً بكم في سهرة اللعبة التفاعلية الذكية!",
        "ترقبوا التحالفات والخيانات والمفاجآت في كل رمية نرد..."
      ];
    }
    return events.slice(-5);
  }, [events]);

  // مضاعفة العناصر لتشكيل شريط انزلاقي متصل بدون انقطاع
  const marqueeItems = useMemo(() => {
    return [...latestEvents, ...latestEvents];
  }, [latestEvents]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      dir="rtl"
      className={`relative w-full overflow-hidden rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-rose-500/40 transition-colors shadow-2xl backdrop-blur-md px-3.5 py-2 flex items-center gap-3 select-none ${className}`}
    >
      {/* شارة 'عاجل' المتوهجة باللون الأحمر مع نبض تفاعلي وأيقونة متحركة */}
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          boxShadow: [
            "0 0 10px rgba(239, 68, 68, 0.4)",
            "0 0 22px rgba(239, 68, 68, 0.75)",
            "0 0 10px rgba(239, 68, 68, 0.4)"
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-black text-xs md:text-sm border border-red-400/50 shadow-lg"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        <span className="tracking-wider">عاجل</span>
      </motion.div>

      {/* فاصل عمودي أنيق */}
      <div className="h-6 w-px bg-slate-800 shrink-0" />

      {/* عنوان الشريط الجانبي */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-xs font-black text-rose-300/90">
        <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
        <span>شريط الأخبار:</span>
      </div>

      {/* منطقة شريط الأخبار المنزلق */}
      <div className="flex-1 overflow-hidden relative">
        {/* تدرج ظلال الحواف لمنح تأثير الدخول والخروج الناعم */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950/95 via-slate-950/70 to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent z-10 pointer-events-none" />

        {/* المسار المتحرك بحركة انزلاق أفقية مستمرة */}
        <motion.div
          key={latestEvents.join("|")}
          dir="ltr"
          className="flex items-center gap-8 whitespace-nowrap w-max"
          animate={{
            x: ["0%", "-50%"]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: Math.max(16, latestEvents.length * 6),
              ease: "linear"
            }
          }}
        >
          {marqueeItems.map((item, idx) => {
            const isLatest =
              idx === latestEvents.length - 1 || idx === marqueeItems.length - 1;

            return (
              <div
                key={`${idx}-${item.slice(0, 15)}`}
                dir="rtl"
                className="flex items-center gap-2 text-xs md:text-sm text-slate-200"
              >
                {isLatest ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[11px] border border-amber-400/40 shrink-0 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    الحدث الأخير
                  </span>
                ) : (
                  <span className="text-amber-400/90 font-bold shrink-0">⚡</span>
                )}
                <span className="font-medium text-slate-100 hover:text-white transition-colors">
                  {item}
                </span>
                <span className="text-slate-600 font-bold mx-2 select-none">✦</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
