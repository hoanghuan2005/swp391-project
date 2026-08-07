import { useState } from "react";
import { AlertCircle, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PricingModal from "@/components/modals/PricingModal";
import useAiUsage from "@/hooks/useAiUsage";

const CONTENT = {
  AI: {
    title: "Daily AI Limit Reached",
    fallback: "You have reached your daily AI request limit.",
  },
  DOCUMENT: {
    title: "Document Quota Reached",
    fallback: "You have reached your document count or storage limit.",
  },
  FILE_SIZE: {
    title: "File Size Limit Exceeded",
    fallback: "The system does not support files larger than 10MB.",
  },
  STORAGE: {
    title: "Storage Capacity Exceeded",
    fallback: "You have reached the maximum storage capacity limit for your account.",
  },
};

export default function QuotaExceededDialog({
  open,
  onOpenChange,
  type = "DOCUMENT",
  message,
  fileSize,
  onUpgrade,
}) {
  const [pricingOpen, setPricingOpen] = useState(false);
  const { subscriptionTier } = useAiUsage();
  const content = CONTENT[type] || CONTENT.DOCUMENT;
  const role = getTokenRole();
  const canUpgrade = role !== "ADMIN" && String(subscriptionTier || "FREE").toUpperCase() !== "PRO";

  const isOverSystemMax =
    (fileSize && fileSize > 10 * 1024 * 1024) ||
    (message &&
      (message.toLowerCase().includes("does not support files larger than 10mb") ||
        message.toLowerCase().includes("system maximum file size")));

  const isStorageLimit =
    type === "STORAGE" ||
    (message &&
      (message.toLowerCase().includes("storage") ||
        message.toLowerCase().includes("capacity") ||
        message.toLowerCase().includes("lưu trữ") ||
        message.toLowerCase().includes("dung lượng")));

  let displayTitle = isStorageLimit ? "Storage Capacity Exceeded" : content.title;
  let displayMessage = message || content.fallback;

  if (isOverSystemMax) {
    displayMessage = "The system does not support files larger than 10MB.";
  } else if (isStorageLimit && !message) {
    if (canUpgrade) {
      displayMessage =
        "Your account has reached its storage capacity limit. Please upgrade your subscription plan to get more storage capacity.";
    } else {
      displayMessage =
        "Your account has reached its maximum storage capacity limit. Please wait for new plan updates from system administrators or manage your existing storage.";
    }
  }

  const showUpgradeButton = canUpgrade && !isOverSystemMax;

  const handleUpgradeClick = () => {
    onOpenChange(false);
    onUpgrade?.();
    setPricingOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-3xl border border-orange-100 bg-white p-0 shadow-2xl shadow-orange-950/10 overflow-hidden">
          <div className="bg-gradient-to-br from-orange-50 via-white to-slate-50 px-6 pt-6 pb-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f26522] text-white shadow-lg shadow-orange-500/25">
              {type === "AI" ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900">
                {displayTitle}
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6 text-slate-600">
                {displayMessage}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="gap-2 px-6 pb-6 sm:justify-end">
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 cursor-pointer font-bold text-xs"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {showUpgradeButton && (
              <Button
                className="rounded-xl bg-[#f26522] text-white shadow-lg shadow-orange-500/20 hover:bg-[#d95316] cursor-pointer font-bold text-xs"
                onClick={handleUpgradeClick}
              >
                <Crown className="mr-2 h-4 w-4 fill-amber-300 text-amber-300" />
                View Plans & Upgrade PRO
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  );
}

function getTokenRole() {
  return localStorage.getItem("userRole") || null;
}
