import React from "react";
import { Trash2, AlertTriangle, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  // Determine modal type based on title/message content
  const isDelete = title?.toLowerCase().includes("delete") || message?.toLowerCase().includes("delete");
  const isBan = title?.toLowerCase().includes("ban") || message?.toLowerCase().includes("ban");

  let Icon = HelpCircle;
  let iconBgColor = "bg-blue-50";
  let iconColor = "text-blue-600";
  let confirmBtnText = "Confirm";
  let confirmBtnClass = "bg-[#f26522] hover:bg-[#d95316] text-white";

  if (isDelete) {
    Icon = Trash2;
    iconBgColor = "bg-red-50";
    iconColor = "text-red-500";
    confirmBtnText = "Delete";
    confirmBtnClass = "bg-red-500 hover:bg-red-600 text-white";
  } else if (isBan) {
    Icon = AlertTriangle;
    iconBgColor = "bg-amber-50";
    iconColor = "text-amber-500";
    confirmBtnText = title?.toLowerCase().includes("unban") || message?.toLowerCase().includes("unban") ? "Unban" : "Ban";
    confirmBtnClass = title?.toLowerCase().includes("unban") || message?.toLowerCase().includes("unban")
      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
      : "bg-amber-500 hover:bg-amber-600 text-white";
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-900/10 w-full max-w-sm overflow-hidden p-6 relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button on Top Right */}
        <button 
          onClick={onCancel}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Action Icon */}
          <div className={`w-14 h-14 ${iconBgColor} ${iconColor} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
            <Icon className="w-7 h-7" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">
            {title || "Confirm Action"}
          </h3>

          {/* Message */}
          <p className="text-sm text-slate-500 mt-2.5 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-xl border-slate-200 font-semibold hover:bg-slate-50 text-slate-600 h-10 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl font-semibold h-10 cursor-pointer border-none ${confirmBtnClass}`}
          >
            {confirmBtnText}
          </Button>
        </div>

      </div>
    </div>
  );
}
