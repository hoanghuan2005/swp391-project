import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmVnpayReturn } from "@/api/paymentApi";

export default function PaymentVnpayReturnPage() {
  const [searchParams] = useSearchParams();
  const hasTxnRef = Boolean(searchParams.get("vnp_TxnRef"));
  const [confirmation, setConfirmation] = useState(null);
  const [confirming, setConfirming] = useState(hasTxnRef);
  const [confirmError, setConfirmError] = useState(null);

  const paymentState = useMemo(() => {
    if (confirming) {
      return {
        icon: Clock,
        title: "Confirming payment",
        description:
          "We are securely verifying your VNPAY payment before updating your plan.",
        tone: "text-amber-600",
        bg: "bg-amber-50",
      };
    }

    if (confirmation?.status === "SUCCESS") {
      return {
        icon: CheckCircle2,
        title: "Payment confirmed",
        description:
          "Your payment was verified successfully. Your PRO plan is now active.",
        tone: "text-emerald-600",
        bg: "bg-emerald-50",
      };
    }

    if (confirmation?.status === "FAILED") {
      return {
        icon: XCircle,
        title: "Payment was not completed",
        description:
          "The sandbox payment was cancelled or declined. Your plan has not been changed.",
        tone: "text-red-600",
        bg: "bg-red-50",
      };
    }

    if (confirmError) {
      return {
        icon: XCircle,
        title: "Could not confirm payment",
        description:
          "We could not verify this VNPAY return securely. Please try again or contact support.",
        tone: "text-red-600",
        bg: "bg-red-50",
      };
    }

    const responseCode = searchParams.get("vnp_ResponseCode");
    const transactionStatus = searchParams.get("vnp_TransactionStatus");

    if (responseCode === "00" && transactionStatus === "00") {
      return {
        icon: CheckCircle2,
        title: "Payment completed",
        description:
          "VNPAY has accepted your sandbox payment. We are preparing to confirm it securely.",
        tone: "text-emerald-600",
        bg: "bg-emerald-50",
      };
    }

    if (!responseCode) {
      return {
        icon: Clock,
        title: "Payment status pending",
        description:
          "We could not read a VNPAY result from this return URL. Check your plan again in a moment.",
        tone: "text-amber-600",
        bg: "bg-amber-50",
      };
    }

    return {
      icon: XCircle,
      title: "Payment was not completed",
      description:
        "The sandbox payment was cancelled or declined. Your plan has not been changed.",
      tone: "text-red-600",
      bg: "bg-red-50",
    };
  }, [confirmation?.status, confirmError, confirming, searchParams]);

  useEffect(() => {
    let active = true;

    const txnRef = searchParams.get("vnp_TxnRef");
    if (!txnRef) {
      return () => {
        active = false;
      };
    }

    const params = Object.fromEntries(searchParams.entries());

    confirmVnpayReturn(params)
      .then((result) => {
        if (active) {
          setConfirmation(result);
        }
      })
      .catch(() => {
        if (active) {
          setConfirmError("Unable to confirm payment");
        }
      })
      .finally(() => {
        if (active) {
          setConfirming(false);
        }
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  const Icon = paymentState.icon;
  const txnRef = confirmation?.txnRef || searchParams.get("vnp_TxnRef");

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-6 py-10">
      <div className="w-full rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl ${paymentState.bg}`}
        >
          <Icon className={`h-8 w-8 ${paymentState.tone}`} />
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          {paymentState.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {paymentState.description}
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-xs text-slate-500">
          {txnRef && (
            <div className="flex justify-between gap-4">
              <span className="font-semibold text-slate-400">Transaction</span>
              <span className="truncate font-bold text-slate-700">{txnRef}</span>
            </div>
          )}
          {confirmation?.subscriptionTier && (
            <div className="mt-2 flex justify-between gap-4">
              <span className="font-semibold text-slate-400">Current plan</span>
              <span className="font-bold text-slate-700">
                {confirmation.subscriptionTier}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-xl bg-[#f26522] hover:bg-[#d95316]">
            <Link to="/home">Go home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/pricing">View plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
