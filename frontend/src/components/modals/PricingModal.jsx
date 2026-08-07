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
    setIsFetchingPlans(true);
    axiosClient.get("/api/subscription/plans")
      .then((res) => {
        if (isSubscribed && res.data && res.data.length > 0) {
          const sorted = (res.data || []).sort((a, b) => (a.priceVnd || 0) - (b.priceVnd || 0));
          setDbPlans(sorted);
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
  const canUpgrade = role !== "ADMIN" && String(subscriptionTier || "FREE").toUpperCase() !== "PRO";

  const handleUpgrade = async (targetPlanCode = "PRO") => {
    if (!isLoggedIn) {
      toast.info("Please log in to upgrade!");
      handleClose();
      navigate("/login");
      return;
    }

    if (isStartingUpgrade || !canUpgrade) return;

    try {
      setIsStartingUpgrade(true);
      const payment = await createVnpayPayment(targetPlanCode);
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

  const rawPlans = [...dbPlans].sort((a, b) => (a.priceVnd || 0) - (b.priceVnd || 0));

  const displayPlans = rawPlans.map((p) => {
    const isPro = p.code === "PRO";
    const isFree = p.code === "FREE";

    return {
      code: p.code,
      name: p.name || p.code,
      priceVnd: p.priceVnd || 0,
      description: isFree ? "For trying Study Hub AI features." : (isPro ? "For frequent study sessions." : "Special plan for students and creators."),
      price: formatVndPrice(p.priceVnd),
      period: p.priceVnd === 0 ? "forever" : "month",
      features: [
        p.dailyAiLimit === -1 ? "Unlimited AI requests" : `${p.dailyAiLimit} AI requests per day`,
        `Select up to ${p.maxSelectedDocs ?? 2} documents per AI query`,
        `Up to ${p.maxWorkspaceDocs ?? 10} documents per workspace`,
        p.maxFlashcardsPerGeneration === -1 ? "Unlimited flashcards per generation" : `Up to ${p.maxFlashcardsPerGeneration} flashcards per generation`,
        p.maxQuizQuestionsPerGeneration === -1 ? "Unlimited quiz questions per generation" : `Up to ${p.maxQuizQuestionsPerGeneration} quiz questions per generation`,
        p.maxOwnedProjects === -1 ? "Unlimited workspaces" : `Create up to ${p.maxOwnedProjects} workspaces`,
        `${formatBytes(p.maxFileSizeBytes)} max file size`,
        `${formatBytes(p.totalStorageBytes)} total storage capacity`,
        p.dailyUploadLimit === -1 ? "Unlimited document uploads" : `${p.dailyUploadLimit} document uploads per day`,
      ],
      action: isFree ? "Free Plan" : `Upgrade to ${p.name || p.code}`,
    };
  });

  return (
    <>
      <Dialog open={!!isModalOpen} onOpenChange={(openState) => !openState && handleClose()}>
        <DialogContent className="sm:max-w-3xl rounded-[28px] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-slate-50/95 backdrop-blur-md">
          <DialogHeader className="p-5 pb-2 text-center">
            <DialogTitle className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2">
              Choose Your Plan <Crown className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1 max-w-md mx-auto leading-relaxed">
              Unlock advanced AI features, higher storage capacity, and boost your productivity with our subscription plans.
            </DialogDescription>
          </DialogHeader>

          {isFetchingPlans && displayPlans.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#f26522]" /> Loading plans from database...
            </div>
          ) : displayPlans.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              No active subscription plans available.
            </div>
          ) : (
            <div className={`grid gap-4 md:grid-cols-${Math.min(displayPlans.length, 3)} px-6 pb-6`}>
              {displayPlans.map((plan) => {
                const planCode = String(plan.code || plan.name).toUpperCase();
                const isPro = planCode === "PRO";
                const isFree = planCode === "FREE";
                const currentTier = String(subscriptionTier || "FREE").toUpperCase();
                const effectiveTier = role === "ADMIN" ? "PRO" : currentTier;
                
                // Dynamic tier comparison based on plan price (priceVnd)
                const userCurrentPlanObj = rawPlans.find(
                  (p) => String(p.code || p.name).toUpperCase() === effectiveTier
                );
                const currentUserPrice = userCurrentPlanObj ? (userCurrentPlanObj.priceVnd || 0) : 0;
                const cardPrice = plan.priceVnd || 0;

                const isCurrent = isLoggedIn && effectiveTier === planCode;
                const isLowerTier = isLoggedIn && !isCurrent && currentUserPrice > cardPrice;
                const isDisabled = isCurrent || isLowerTier || isStartingUpgrade || loading;

                let buttonLabel = plan.action;
                if (isCurrent) {
                  buttonLabel = "Current plan";
                } else if (isLowerTier) {
                  buttonLabel = `Included in ${effectiveTier}`;
                } else if (!isFree) {
                  buttonLabel = `Upgrade to ${plan.name || plan.code}`;
                }

                return (
                  <div
                    key={plan.code || plan.name}
                    className={`relative flex flex-col justify-between rounded-2xl p-5 bg-white transition-all duration-300 ${
                      isPro
                        ? "border-2 border-orange-500 shadow-[0_8px_30px_rgba(242,101,34,0.15)] scale-[1.01]"
                        : "border border-slate-200/80 shadow-sm"
                    }`}
                  >
                    {isPro && !isCurrent && !isLowerTier && (
                      <span className="absolute -top-3 right-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm tracking-wider uppercase flex items-center gap-1">
                        <Crown className="w-3 h-3 fill-white" /> Popular
                      </span>
                    )}

                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                        {plan.name}
                        {isPro && <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-400">{plan.description}</p>
                      
                      <div className="mt-3 flex items-baseline">
                        <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{plan.price}</span>
                        <span className="text-[11px] text-slate-400 ml-1">/ {plan.period}</span>
                      </div>

                      <ul className="my-4 space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 font-medium">
                            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <Button
                        className={`w-full rounded-xl py-3.5 font-bold text-xs shadow-md transition-all duration-300 ${
                          isCurrent || isLowerTier
                            ? "bg-slate-100 hover:bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none"
                            : "bg-[#f26522] hover:bg-[#d95316] text-white hover:shadow-orange-500/20 cursor-pointer"
                        }`}
                        disabled={isDisabled}
                        onClick={() => handleUpgrade(plan.code)}
                      >
                        {isStartingUpgrade ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : !isCurrent && !isLowerTier ? (
                          <Crown className="mr-1.5 h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                        ) : null}
                        {buttonLabel}
                      </Button>
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
