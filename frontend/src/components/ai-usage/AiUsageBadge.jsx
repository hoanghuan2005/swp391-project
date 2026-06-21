import React from "react";
import { Crown, Sparkles, Loader2 } from "lucide-react";

export default function AiUsageBadge({
  subscriptionTier,
  remainingUsage,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/50 px-3.5 py-1.5 text-xs text-slate-400">
        <Loader2 className="w-3 h-3 animate-spin text-[#f26522]" />
        <span>Loading AI quota...</span>
      </div>
    );
  }

  const isPro = subscriptionTier === "PRO" || remainingUsage === -1;

  if (isPro) {
    return (
      <div className="group relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f26522] via-[#ff7836] to-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 border border-orange-400/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer">
        <Crown className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
        <span className="tracking-wide text-[11px]">PRO • Unlimited AI</span>
        <span className="absolute -inset-px rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    );
  }

  const remaining = remainingUsage ?? 0;
  const isOut = remaining <= 0;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-pointer ${
        isOut
          ? "border-rose-200 bg-rose-50/80 text-rose-600 shadow-rose-100"
          : remaining <= 2
          ? "border-amber-200 bg-amber-50/80 text-amber-600 shadow-amber-100"
          : "border-orange-200 bg-orange-50/80 text-[#f26522] shadow-orange-50"
      }`}
    >
      <span className="relative flex h-2 w-2">
        {!isOut && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              remaining <= 2 ? "bg-amber-400" : "bg-orange-400"
            }`}
          ></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isOut ? "bg-rose-500" : remaining <= 2 ? "bg-amber-500" : "bg-[#f26522]"
          }`}
        ></span>
      </span>
      <span className="text-[11px]">
        FREE{" "}
        <span
          className={`font-normal mx-1 ${
            isOut ? "text-rose-300" : remaining <= 2 ? "text-amber-300" : "text-orange-200"
          }`}
        >
          |
        </span>{" "}
        {isOut ? (
          "0 AI left today"
        ) : (
          <>
            <span className="font-extrabold">{remaining}</span> AI left today
          </>
        )}
      </span>
    </div>
  );
}

