import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createVnpayPayment } from "@/api/paymentApi";
import useAiUsage from "@/hooks/useAiUsage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Free",
    description: "For trying Study Hub AI features.",
    price: "0đ",
    period: "forever",
    features: ["Daily AI request limit", "Ask AI", "Quiz and flashcard generation"],
    action: "Current plan",
  },
  {
    name: "Pro",
    description: "For frequent study sessions.",
    price: "99.000đ",
    period: "month",
    features: ["Unlimited AI requests", "Ask AI", "Quiz and flashcard generation", "Priority support", "Exclusive updates"],
    action: "Upgrade to Pro",
  },
];

export default function PricingModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [isStartingUpgrade, setIsStartingUpgrade] = useState(false);
  const { subscriptionTier, loading } = useAiUsage();
  const role = getTokenRole();
  const isLoggedIn = !!localStorage.getItem("token");
  const canUpgrade = role !== "ADMIN" && subscriptionTier === "FREE";

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để nâng cấp lên Pro!");
      onClose();
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
      alert("Could not start payment. Please try again.");
    } catch (error) {
      console.error("Failed to create VNPAY payment:", error);
      alert("Could not start payment. Please try again.");
    } finally {
      setIsStartingUpgrade(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl rounded-[32px] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-slate-50/95 backdrop-blur-md">
        <DialogHeader className="p-8 pb-4 text-center">
          <DialogTitle className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2">
            Choose Your Plan <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500 animate-pulse" />
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Unlock advanced features, unlimited AI requests, and boost your productivity with our Pro plan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 px-8 pb-8">
          {plans.map((plan) => {
            const isPro = plan.name === "Pro";
            const isCurrent = isLoggedIn && (
              (isPro && (subscriptionTier === "PRO" || role === "ADMIN")) ||
              (!isPro && subscriptionTier === "FREE" && role !== "ADMIN")
            );

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-3xl p-6 bg-white transition-all duration-300 ${
                  isPro
                    ? "border-2 border-orange-500 shadow-[0_8px_30px_rgba(242,101,34,0.15)] scale-[1.02] md:scale-105"
                    : "border border-slate-200/80 shadow-sm"
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-sm tracking-wider uppercase">
                    Popular
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
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

                {isPro ? (
                  <Button
                    className={`w-full rounded-xl py-5 font-bold text-sm shadow-md transition-all duration-300 ${
                      isCurrent
                        ? "bg-slate-100 hover:bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none"
                        : "bg-[#f26522] hover:bg-[#d95316] text-white hover:shadow-orange-500/20 hover:scale-[1.02] cursor-pointer"
                    }`}
                    disabled={(!canUpgrade && isLoggedIn) || isStartingUpgrade || loading}
                    onClick={handleUpgrade}
                  >
                    {isStartingUpgrade ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4 fill-white" />
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
            );
          })}
        </div>
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
