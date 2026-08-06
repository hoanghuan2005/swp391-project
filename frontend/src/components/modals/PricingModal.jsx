import React, { useState, useEffect } from "react";
import { Loader2, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createVnpayPayment } from "@/api/paymentApi";
import axiosClient from "@/api/axiosClient";
import useAiUsage from "@/hooks/useAiUsage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === -1) return "Unlimited";
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return (mb / 1024).toFixed(0) + "GB";
  return mb.toFixed(0) + "MB";
}

function formatVndPrice(priceVnd) {
  if (!priceVnd || priceVnd === 0) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(priceVnd) + "đ";
}

const defaultPlans = [
  {
    code: "FREE",
    name: "Free",
    description: "For trying Study Hub AI features.",
    price: "0đ",
    period: "forever",
    features: [
      "5 AI requests per day",
      "Select up to 2 personal documents for AI Chat",
      "Up to 10 documents per workspace",
      "Up to 15 flashcards per generation",
      "Up to 20 quiz questions per generation",
      "Create up to 3 workspaces",
      "5MB max file size",
      "100MB total storage capacity",
      "3 document uploads per day",
    ],
    action: "Free Plan",
  },
  {
    code: "PRO",
    name: "Pro",
    description: "For frequent study sessions.",
    price: "99.000đ",
    period: "month",
    features: [
      "Unlimited AI requests",
      "Select up to 5 personal documents for AI Chat",
      "Up to 20 documents per workspace",
      "Unlimited flashcards per generation",
      "Up to 50 quiz questions per generation",
      "Unlimited workspaces",
      "10MB max file size",
      "1GB total storage capacity",
      "Unlimited document uploads",
      "Priority support",
    ],
    action: "Upgrade to Pro",
  },
];

export default function PricingModal({ open, onOpenChange, isOpen, onClose }) {
  const navigate = useNavigate();
  const [isStartingUpgrade, setIsStartingUpgrade] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [dbPlans, setDbPlans] = useState([]);
  const [isFetchingPlans, setIsFetchingPlans] = useState(false);

  const { subscriptionTier, loading, refreshAiUsage } = useAiUsage();

  const isModalOpen = open !== undefined ? open : isOpen;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    if (!isModalOpen) return;
    let isSubscribed = true;
    axiosClient.get("/api/subscription/plans")
      .then((res) => {
        if (isSubscribed && res.data && res.data.length > 0) {
          setDbPlans(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch active plans:", err);
      })
      .finally(() => {
        if (isSubscribed) {
          setIsFetchingPlans(false);
        }
      });
    return () => {
      isSubscribed = false;
    };
  }, [isModalOpen]);

  const role = getTokenRole();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const canUpgrade = role !== "ADMIN" && subscriptionTier === "FREE";

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      toast.info("Please log in to upgrade to Pro!");
      handleClose();
      navigate("/login");
      return;
    }

    if (isStartingUpgrade || !canUpgrade) return;

    try {
      setIsStartingUpgrade(true);
      const payment = await createVnpayPayment();
      if (payment?.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }
      toast.error("Could not start payment. Please try again.");
    } catch (error) {
      console.error("Failed to create VNPAY payment:", error);
      toast.error("Could not start payment. Please try again.");
    } finally {
      setIsStartingUpgrade(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCanceling(true);
      const res = await axiosClient.post("/api/subscription/cancel");
      if (res.data?.success || res.status === 200) {
        toast.success("PRO subscription successfully canceled. Your account has been reverted to Free Plan.");
        setConfirmCancelOpen(false);
        handleClose();
        if (refreshAiUsage) refreshAiUsage();
        window.dispatchEvent(new CustomEvent("subscription-success"));
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error(error.response?.data?.message || "Failed to cancel subscription. Please try again!");
    } finally {
      setIsCanceling(false);
    }
  };

  const displayPlans = dbPlans.length > 0 ? dbPlans.map((p) => {
    const isPro = p.code === "PRO";
    const isFree = p.code === "FREE";

    const aiMemoryFeature = p.maxAiContextChunks > 4 
      ? "Better AI memory & smarter responses" 
      : "Standard AI memory";

    const docAnalysisFeature = p.maxChunkChars >= 600 
      ? "Deep document analysis with broader context" 
      : "Basic document analysis";

    return {
      code: p.code,
      name: p.name || p.code,
      description: isFree ? "For trying Study Hub AI features." : (isPro ? "For frequent study sessions." : "Special plan for students and creators."),
      price: formatVndPrice(p.priceVnd),
      period: p.priceVnd === 0 ? "forever" : "month",
      features: [
        p.dailyAiLimit === -1 ? "Unlimited AI requests" : `${p.dailyAiLimit} AI requests per day`,
        aiMemoryFeature,
        docAnalysisFeature,
        `Select up to ${p.maxPersonalDocs ?? 2} personal documents for AI Chat`,
        `Up to ${p.maxWorkspaceDocs ?? 10} documents per workspace`,
        p.maxFlashcardsPerGeneration === -1 ? "Unlimited flashcards per generation" : `Up to ${p.maxFlashcardsPerGeneration} flashcards per generation`,
        p.maxQuizQuestionsPerGeneration === -1 ? "Unlimited quiz questions per generation" : `Up to ${p.maxQuizQuestionsPerGeneration} quiz questions per generation`,
        p.maxOwnedProjects === -1 ? "Unlimited workspaces" : `Create up to ${p.maxOwnedProjects} workspaces`,
        `${formatBytes(p.maxFileSizeBytes)} max file size`,
        `${formatBytes(p.totalStorageBytes)} total storage capacity`,
        p.dailyUploadLimit === -1 ? "Unlimited document uploads" : `${p.dailyUploadLimit} document uploads per day`,
        ...(isPro ? ["Priority support"] : []),
      ],
      action: isFree ? "Free Plan" : `Upgrade to ${p.name || p.code}`,
    };
  }) : defaultPlans;

  return (
    <>
      <Dialog open={!!isModalOpen} onOpenChange={(openState) => !openState && handleClose()}>
        <DialogContent className="sm:max-w-4xl rounded-[32px] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-slate-50/95 backdrop-blur-md">
          <DialogHeader className="p-8 pb-4 text-center">
            <DialogTitle className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2">
              Choose Your Plan <Crown className="h-6 w-6 text-amber-500 fill-amber-500 animate-pulse" />
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Unlock advanced AI features, higher storage capacity, and boost your productivity with our subscription plans.
            </DialogDescription>
          </DialogHeader>

          {isFetchingPlans && displayPlans.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#f26522]" /> Loading plans...
            </div>
          ) : (
            <div className={`grid gap-6 md:grid-cols-${Math.min(displayPlans.length, 3)} px-8 pb-8`}>
              {displayPlans.map((plan) => {
                const planCode = String(plan.code || plan.name).toUpperCase();
                const isPro = planCode === "PRO";
                const isFree = planCode === "FREE";
                const currentTier = String(subscriptionTier || "FREE").toUpperCase();
                const effectiveTier = role === "ADMIN" ? "PRO" : currentTier;
                const isCurrent = isLoggedIn && effectiveTier === planCode;

                return (
                  <div
                    key={plan.code || plan.name}
                    className={`relative flex flex-col justify-between rounded-3xl p-6 bg-white transition-all duration-300 ${
                      isPro
                        ? "border-2 border-orange-500 shadow-[0_8px_30px_rgba(242,101,34,0.15)] scale-[1.02] md:scale-105"
                        : "border border-slate-200/80 shadow-sm"
                    }`}
                  >
                    {isPro && !isCurrent && (
                      <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-sm tracking-wider uppercase flex items-center gap-1">
                        <Crown className="w-3 h-3 fill-white" /> Popular
                      </span>
                    )}

                    <div>
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {plan.name}
                        {isPro && <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">{plan.description}</p>
                      
                      <div className="mt-4 flex items-baseline">
                        <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{plan.price}</span>
                        <span className="text-xs text-slate-400 ml-1">/ {plan.period}</span>
                      </div>

                      <ul className="my-6 space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      {!isFree ? (
                        <Button
                          className={`w-full rounded-xl py-5 font-bold text-sm shadow-md transition-all duration-300 ${
                            isCurrent
                              ? "bg-slate-100 hover:bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none"
                              : "bg-[#f26522] hover:bg-[#d95316] text-white hover:shadow-orange-500/20 hover:scale-[1.02] cursor-pointer"
                          }`}
                          disabled={isCurrent || isStartingUpgrade || loading}
                          onClick={handleUpgrade}
                        >
                          {isStartingUpgrade ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Crown className="mr-2 h-4 w-4 fill-amber-300 text-amber-300" />
                          )}
                          {isCurrent ? "Current plan" : plan.action}
                        </Button>
                      ) : (
                        <Button
                          className="w-full rounded-xl py-5 bg-slate-100 text-slate-500 border border-slate-200 shadow-none font-bold text-sm cursor-not-allowed"
                          disabled
                        >
                          {isCurrent ? "Current plan" : plan.action}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Cancel Subscription */}
      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-800">
              Cancel Pro Subscription?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-2">
              Are you sure you want to cancel your <strong>Pro Subscription</strong>? Your account will revert to the <strong>Free Tier</strong> with standard limits.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <Button
              variant="outline"
              disabled={isCanceling}
              onClick={() => setConfirmCancelOpen(false)}
              className="rounded-xl font-bold"
            >
              Keep Pro Plan
            </Button>
            <Button
              disabled={isCanceling}
              onClick={handleCancelSubscription}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Cancellation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getTokenRole() {
  return localStorage.getItem("userRole") || null;
}
