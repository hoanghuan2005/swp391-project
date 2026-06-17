import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createVnpayPayment } from "@/api/paymentApi";
import useAiUsage from "@/hooks/useAiUsage";

const plans = [
  {
    name: "Free",
    description: "For trying Study Hub AI features.",
    features: ["Daily AI request limit", "Ask AI", "Quiz and flashcard generation"],
    action: "Current plan",
  },
  {
    name: "Pro",
    description: "For frequent study sessions.",
    features: ["Unlimited AI requests", "Ask AI", "Quiz and flashcard generation"],
    action: "Upgrade to Pro",
  },
];

export default function PricingPage() {
  const [isStartingUpgrade, setIsStartingUpgrade] = useState(false);
  const { subscriptionTier, loading } = useAiUsage();
  const role = getTokenRole();
  const canUpgrade = role !== "ADMIN" && subscriptionTier === "FREE";

  const handleUpgrade = async () => {
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
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Plans</h1>
        <p className="mt-2 text-slate-500">
          Choose the AI usage level that fits your study routine.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
            <ul className="my-6 space-y-2 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature}>- {feature}</li>
              ))}
            </ul>
            {plan.name === "Pro" ? (
              <Button
                className="w-full rounded-xl bg-[#f26522] hover:bg-[#d95316]"
                disabled={!canUpgrade || isStartingUpgrade || loading}
                onClick={handleUpgrade}
              >
                {isStartingUpgrade ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {subscriptionTier === "PRO" || role === "ADMIN"
                  ? "Current plan"
                  : plan.action}
              </Button>
            ) : (
              <Button className="w-full rounded-xl" disabled>
                {subscriptionTier === "FREE" && role !== "ADMIN"
                  ? "Current plan"
                  : plan.action}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
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
