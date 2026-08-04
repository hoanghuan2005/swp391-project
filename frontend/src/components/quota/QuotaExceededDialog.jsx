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
    title: "Daily AI limit reached",
    fallback: "You have reached your daily AI request limit.",
  },
  DOCUMENT: {
    title: "Document limit reached",
    fallback: "You have reached your document upload or storage limit.",
  },
  FILE_SIZE: {
    title: "File is too large",
    fallback: "This file exceeds the maximum size for your current plan.",
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
  const canUpgrade = role !== "ADMIN" && subscriptionTier === "FREE";

  const isOverSystemMax = (fileSize && fileSize > 10 * 1024 * 1024) || 
    (message && (message.includes("10MB") || message.includes("10 MB")));

  let displayMessage = message || content.fallback;
  if (type === "FILE_SIZE") {
    if (isOverSystemMax) {
      displayMessage =
        "This file exceeds the maximum 10MB system upload limit. Files larger than 10MB are strictly capped by the cloud server.";
    } else {
      displayMessage =
        "This file exceeds the 5MB maximum file size limit for Free accounts. Please upgrade to a PRO plan to upload files up to 10MB.";
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
                {content.title}
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
