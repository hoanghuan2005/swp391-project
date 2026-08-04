import React, { useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, FileUp, HardDrive, Zap, BookOpen, CheckCircle, ShieldAlert } from "lucide-react";
import PricingModal from "@/components/modals/PricingModal";
import { toast } from "sonner";

function bytesToMB(bytes) {
  if (bytes === null || bytes === undefined || bytes === -1) return "Unlimited";
  const mb = Math.round(bytes / (1024 * 1024));
  if (mb >= 1024) return (mb / 1024).toFixed(1) + " GB";
  return mb + " MB";
}

function formatVND(amount) {
  if (!amount || amount === 0) return "0 đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export default function MySubscriptionModal({ open, onOpenChange }) {
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Cancel subscription confirmation dialog
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const fetchMySubscription = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/api/subscription/my-subscription");
      setSubData(res.data);
    } catch (err) {
      console.error("Failed to load my subscription details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMySubscription();
    }
  }, [open]);

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true);
      await axiosClient.post("/api/subscription/cancel");
      toast.success("PRO subscription successfully canceled. Your account has been reverted to Free Plan.");
      setCancelConfirmOpen(false);
      fetchMySubscription();
      window.dispatchEvent(new CustomEvent("subscription-success"));
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error(error.response?.data?.message || "Failed to cancel subscription. Please try again!");
    } finally {
      setCanceling(false);
    }
  };

  const isPro = subData?.subscriptionTier === "PRO";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 text-[#f26522] rounded-2xl">
                <Crown className="w-6 h-6 fill-orange-500/20" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  My Subscription Details
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-xs">
                  Your active subscription tier and current resource allocations.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm font-medium">
              Loading subscription details...
            </div>
          ) : subData ? (
            <div className="space-y-5 py-2">
              {/* Main Plan Card */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isPro
                    ? "bg-gradient-to-br from-orange-50/60 via-white to-amber-50/30 border-orange-300 shadow-md shadow-orange-500/10"
                    : "bg-slate-50/80 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`font-black text-xs px-3 py-1 rounded-full ${
                        isPro
                          ? "bg-[#fff0e5] text-[#f26522] border border-orange-200"
                          : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                    >
                      {subData.subscriptionTier} PLAN
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[11px] font-bold">
                      <CheckCircle className="w-3 h-3 mr-1" /> Active
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#f26522]">
                      {formatVND(subData.priceVnd)}
                    </span>
                    <span className="text-xs text-slate-400 font-normal"> / month</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mt-3 flex items-center gap-1.5">
                  {subData.planName} {isPro && <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />}
                </h3>
              </div>

              {/* Quotas & Features Breakdown */}
              <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-slate-400" /> Max File Upload Size
                  </span>
                  <span className="font-bold text-slate-800">{bytesToMB(subData.maxFileSizeBytes)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-slate-400" /> Storage Capacity
                  </span>
                  <span className="font-bold text-slate-800">{bytesToMB(subData.totalStorageBytes)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-400" /> Daily AI Requests
                  </span>
                  <span className="font-bold text-slate-800">
                    {subData.dailyAiLimit === -1 ? "Unlimited" : `${subData.dailyAiLimit} requests / day`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" /> Flashcards / Generation
                  </span>
                  <span className="font-bold text-slate-800">
                    {subData.maxFlashcardsPerGeneration === -1 ? "Unlimited" : `${subData.maxFlashcardsPerGeneration} cards`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-slate-400" /> Quiz Questions / Generation
                  </span>
                  <span className="font-bold text-slate-800">
                    {subData.maxQuizQuestionsPerGeneration === -1 ? "Unlimited" : `${subData.maxQuizQuestionsPerGeneration} questions`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Crown className="w-4 h-4 text-slate-400" /> Owned Workspaces Limit
                  </span>
                  <span className="font-bold text-slate-800">
                    {subData.maxOwnedProjects === -1 ? "Unlimited" : `${subData.maxOwnedProjects} workspaces`}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 sm:justify-between">
            {isPro ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelConfirmOpen(true)}
                className="rounded-xl text-rose-600 hover:bg-rose-50 border-rose-200 font-bold text-xs"
              >
                <ShieldAlert className="w-4 h-4 mr-1.5" /> Cancel Pro Plan
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setPricingModalOpen(true);
                }}
                className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-bold text-xs"
              >
                <Crown className="w-4 h-4 mr-1.5 fill-amber-300 text-amber-300" /> Upgrade to PRO
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-slate-200 font-bold text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Cancel Pro Subscription?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-1">
              Are you sure you want to cancel your <strong>Pro Subscription</strong>? Your account will revert to the <strong>Free Plan</strong> with standard resource limits.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelConfirmOpen(false)}
              className="rounded-xl font-bold text-xs"
            >
              Keep Pro Plan
            </Button>
            <Button
              type="button"
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              {canceling ? "Canceling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Modal for upgrade */}
      <PricingModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
    </>
  );
}
