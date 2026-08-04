import React, { useState, useEffect } from "react";
import useDocumentQuota from "@/hooks/useDocumentQuota";
import { HardDrive, Crown } from "lucide-react";
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

export default function StorageProgressBar({ isOpen = true }) {
  const { usedStorageBytes, maxStorageBytes, subscriptionTier, refreshDocumentQuota } = useDocumentQuota();
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

  const isPro = subscriptionTier === "PRO";

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
      </div>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  );
}
