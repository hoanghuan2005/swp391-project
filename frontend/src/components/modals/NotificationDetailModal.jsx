import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, Crown, Calendar, Sparkles, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationDetailModal({
  open,
  onOpenChange,
  notification,
  onOpenSubscription,
  onOpenPricing,
}) {
  const navigate = useNavigate();

  if (!notification) return null;

  const isPlanNotification =
    notification.type === "PLAN_UPDATED" ||
    notification.type === "SYSTEM" ||
    notification.title?.toLowerCase().includes("plan") ||
    notification.title?.toLowerCase().includes("policy") ||
    notification.message?.toLowerCase().includes("policy") ||
    notification.message?.toLowerCase().includes("limits");

  const formattedDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  const handleViewPricing = () => {
    onOpenChange(false);
    if (onOpenPricing) {
      onOpenPricing();
    } else if (onOpenSubscription) {
      onOpenSubscription();
    }
  };

  const handleViewMySub = () => {
    onOpenChange(false);
    if (onOpenSubscription) {
      onOpenSubscription();
    }
  };

  const handleAction = () => {
    onOpenChange(false);
    if (notification.referenceType === "DOCUMENT" && notification.referenceId) {
      navigate(`/documents/${notification.referenceId}`);
    } else if (notification.referenceType === "WORKSPACE" && notification.referenceId) {
      navigate(`/workspace/${notification.referenceId}`);
    } else if (notification.referenceType === "USER" && notification.referenceId) {
      navigate(`/users/${notification.referenceId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#f26522] border border-orange-100 flex items-center justify-center shrink-0">
              {isPlanNotification ? (
                <Crown className="w-5 h-5 fill-orange-500/20 text-[#f26522]" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-800 leading-tight">
                {notification.title}
              </DialogTitle>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Message Content */}
        <div className="my-3 p-4 rounded-2xl bg-slate-50 border border-slate-100/80 text-xs text-slate-600 leading-relaxed space-y-2">
          <p className="font-medium text-slate-700 whitespace-pre-line">
            {notification.message}
          </p>

          {isPlanNotification && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs text-[#f26522] font-semibold">
              <Sparkles className="w-4 h-4 fill-orange-400" />
              <span>Subscription policy & resource allocations updated.</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end flex-col sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-xs font-bold cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          {isPlanNotification ? (
            <Button
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              onClick={handleViewPricing}
            >
              <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              View All Plan Policies & Pricing
            </Button>
          ) : (
            notification.referenceId && (
              <Button
                className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                onClick={handleAction}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Target
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
