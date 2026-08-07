import React, { useState, useEffect } from "react";
import useDocumentQuota from "@/hooks/useDocumentQuota";
import { HardDrive, Crown, FileText, UploadCloud } from "lucide-react";
import PricingModal from "@/components/modals/PricingModal";
import { cn } from "@/lib/utils";

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === -1) return "Unlimited";
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return (mb / 1024).toFixed(1) + " GB";
  }
  return mb.toFixed(1) + " MB";
}

export default function StorageProgressBar({ isOpen = true, variant = "default" }) {
  const {
    usedStorageBytes,
    maxStorageBytes,
    subscriptionTier,
    totalDocuments,
    totalDocumentLimit,
    uploadsToday,
    dailyUploadLimit,
    refreshDocumentQuota,
  } = useDocumentQuota();
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    const handleDocumentUploaded = () => {
      refreshDocumentQuota();
    };
    const handleSubscriptionSuccess = () => {
      refreshDocumentQuota();
    };

    window.addEventListener("documents:uploaded", handleDocumentUploaded);
    window.addEventListener("subscription-success", handleSubscriptionSuccess);
    window.addEventListener("subscription:updated", handleSubscriptionSuccess);

    return () => {
      window.removeEventListener("documents:uploaded", handleDocumentUploaded);
      window.removeEventListener("subscription-success", handleSubscriptionSuccess);
      window.removeEventListener("subscription:updated", handleSubscriptionSuccess);
    };
  }, [refreshDocumentQuota]);

  const isUnlimited = !maxStorageBytes || maxStorageBytes === -1;
  const percentage = isUnlimited || !maxStorageBytes ? 0 : Math.min(100, Math.round((usedStorageBytes / maxStorageBytes) * 100));
  const remainingBytes = !isUnlimited && maxStorageBytes ? Math.max(0, maxStorageBytes - usedStorageBytes) : null;

  let barColor = "bg-gradient-to-r from-emerald-500 to-teal-500";
  if (percentage >= 90) {
    barColor = "bg-gradient-to-r from-rose-500 to-red-600";
  } else if (percentage >= 70) {
    barColor = "bg-gradient-to-r from-amber-500 to-orange-500";
  }

  const isPro = subscriptionTier && subscriptionTier.toUpperCase() !== "FREE";

  if (!isOpen) {
    return (
      <>
        <div 
          onClick={() => setPricingOpen(true)}
          title={`Storage capacity: ${formatBytes(usedStorageBytes)} / ${formatBytes(maxStorageBytes)} (${percentage}% used)`}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50/60 cursor-pointer my-2 transition-all border border-slate-200/80 shadow-xs"
        >
          <HardDrive className={cn("w-5 h-5", percentage >= 90 ? "text-rose-500" : "text-[#f26522]")} />
          <span className="text-[10px] font-extrabold text-slate-700 mt-1">{percentage}%</span>
        </div>
        <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
      </>
    );
  }

  if (variant === "banner") {
    return (
      <>
        <div className="mb-6 -mt-2 p-4 rounded-2xl bg-gradient-to-r from-orange-50/40 via-white to-slate-50/80 border border-slate-200/70 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Column: Storage Details & Bar */}
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100/80 flex items-center justify-center text-[#f26522] shadow-2xs">
                  <HardDrive className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Storage Capacity</span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100/90 text-[#f26522] border border-orange-200/60">
                      {isPro && <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />}
                      {subscriptionTier || "FREE"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Used <span className="font-bold text-[#f26522]">{formatBytes(usedStorageBytes)}</span> of <span className="font-bold text-slate-700">{formatBytes(maxStorageBytes)}</span> ({percentage}% used)
                  </p>
                </div>
              </div>

              {!isPro && (
                <button
                  onClick={() => setPricingOpen(true)}
                  className="hidden md:flex items-center gap-1.5 text-xs font-bold text-white bg-[#f26522] hover:bg-[#d95316] px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  Upgrade Plan
                </button>
              )}
            </div>

            <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-100">
              <div
                className={cn("h-full transition-all duration-500 rounded-full", barColor)}
                style={{ width: `${Math.max(percentage, isUnlimited ? 0 : 3)}%` }}
              />
            </div>
          </div>

          {/* Right Column: Statistics Badges */}
          <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200/60 md:pl-5 flex-wrap">
            <div className="flex items-center gap-2.5 bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/70 shadow-2xs">
              <FileText className="w-4 h-4 text-[#f26522]" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">Total Documents</span>
                <span className="text-xs font-extrabold text-slate-800">
                  {totalDocuments !== null ? totalDocuments : 0}{" "}
                  <span className="font-normal text-slate-400 text-[11px]">
                    / {totalDocumentLimit && totalDocumentLimit !== -1 ? `${totalDocumentLimit}` : "Unlimited"}
                  </span>
                </span>
              </div>
            </div>

            {dailyUploadLimit !== null && (
              <div className="flex items-center gap-2.5 bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/70 shadow-2xs">
                <UploadCloud className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">Daily Uploads</span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {uploadsToday !== null ? uploadsToday : 0}{" "}
                    <span className="font-normal text-slate-400 text-[11px]">
                      / {dailyUploadLimit !== -1 ? `${dailyUploadLimit}` : "Unlimited"}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {!isPro && (
              <button
                onClick={() => setPricingOpen(true)}
                className="md:hidden w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#f26522] hover:bg-[#d95316] px-3 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                Upgrade Plan
              </button>
            )}
          </div>
        </div>

        <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
      </>
    );
  }

  return (
    <>
      <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white via-slate-50/80 to-orange-50/30 border border-slate-200/80 shadow-sm transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-[#f26522]" />
            <span className="text-xs font-bold text-slate-800">Storage</span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100/80 text-[#f26522] border border-orange-200/60">
              {isPro && <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />}
              {subscriptionTier || "FREE"}
            </span>
          </div>

          {!isPro && (
            <button
              onClick={() => setPricingOpen(true)}
              className="flex items-center gap-1 text-[11px] font-bold text-[#f26522] hover:text-[#d95316] bg-orange-100/70 hover:bg-orange-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
              Upgrade
            </button>
          )}
        </div>

        <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden mb-2 p-0.5 border border-slate-100">
          <div
            className={cn("h-full transition-all duration-500 rounded-full", barColor)}
            style={{ width: `${Math.max(percentage, isUnlimited ? 0 : 3)}%` }}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-800">
              Used: <span className="text-[#f26522]">{formatBytes(usedStorageBytes)}</span>
            </span>
            <span className="font-semibold text-slate-500 text-[11px]">
              Max: {formatBytes(maxStorageBytes)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
            <span>
              {percentage}% used
            </span>
            <span>
              {remainingBytes !== null ? `Free: ${formatBytes(remainingBytes)}` : "Unlimited storage"}
            </span>
          </div>
        </div>

        {/* Document & Upload Statistics */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <FileText className="w-3 h-3 text-[#f26522]" /> Documents:
            </span>
            <span className="font-bold text-slate-800">
              {totalDocuments !== null ? totalDocuments : 0}{" "}
              <span className="font-normal text-slate-400">
                / {totalDocumentLimit && totalDocumentLimit !== -1 ? `${totalDocumentLimit} docs` : "Unlimited"}
              </span>
            </span>
          </div>

          {dailyUploadLimit !== null && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <UploadCloud className="w-3 h-3 text-slate-400" /> Daily Uploads:
              </span>
              <span className="font-semibold text-slate-700">
                {uploadsToday !== null ? uploadsToday : 0}{" "}
                <span className="font-normal text-slate-400">
                  / {dailyUploadLimit !== -1 ? `${dailyUploadLimit}` : "Unlimited"}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  );
}
