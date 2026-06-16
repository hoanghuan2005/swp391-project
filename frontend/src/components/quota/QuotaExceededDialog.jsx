import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createVnpayPayment } from "@/api/paymentApi";
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
  onUpgrade,
}) {
  const [isStartingUpgrade, setIsStartingUpgrade] = useState(false);
  const { subscriptionTier } = useAiUsage();
  const content = CONTENT[type] || CONTENT.DOCUMENT;
  const role = getTokenRole();
  const canUpgrade = role !== "ADMIN" && subscriptionTier === "FREE";

  const handleUpgrade = async () => {
    if (isStartingUpgrade || !canUpgrade) return;

    try {
      setIsStartingUpgrade(true);
      onUpgrade?.();
      const payment = await createVnpayPayment();
      if (payment?.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }
      alert("Could not start payment. Please try again.");
    } catch (error) {
      console.error("Failed to create VNPAY payment:", error);
      alert("Could not start payment. Please try again.");
    } finally {
      setIsStartingUpgrade(false);
    }
  };

  return (
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
              {message || content.fallback}
            </DialogDescription>
        </DialogHeader>
        </div>
        <DialogFooter className="gap-2 px-6 pb-6 sm:justify-end">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
          {canUpgrade && (
            <Button
              className="rounded-xl bg-[#f26522] text-white shadow-lg shadow-orange-500/20 hover:bg-[#d95316]"
              onClick={handleUpgrade}
              disabled={isStartingUpgrade}
            >
              {isStartingUpgrade ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Upgrade to Pro
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getTokenRole() {
  try {
    const token = localStorage.getItem("token");
    return token ? jwtDecode(token)?.role : null;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}
