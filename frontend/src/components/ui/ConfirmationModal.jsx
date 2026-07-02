import React from "react";
import { AlertTriangle, AlertCircle, HelpCircle, Loader2 } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận",
  message = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  variant = "info",
  loading = false,
}) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30",
          icon: <AlertTriangle className="h-6 w-6 text-white animate-pulse" />,
          btnConfirm: "bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 shadow-red-500/20",
        };
      case "warning":
        return {
          iconBg: "bg-gradient-to-br from-[#f26522] to-[#ff9e67] shadow-[#f26522]/30",
          icon: <AlertCircle className="h-6 w-6 text-white ml-0.5" />,
          btnConfirm: "bg-gradient-to-r from-[#f26522] to-[#ff9e67] hover:opacity-95 shadow-[#f26522]/20",
        };
      case "info":
      default:
        return {
          iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/30",
          icon: <HelpCircle className="h-6 w-6 text-white" />,
          btnConfirm: "bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-95 shadow-blue-500/20",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-default animate-in fade-in duration-200"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-[24px] bg-white p-6 text-center shadow-2xl transition-all border border-slate-100 flex flex-col items-center z-10 my-auto animate-in zoom-in-95 duration-200">
        {/* Icon Circle */}
        <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${styles.iconBg}`}>
          {styles.icon}
        </div>

        {/* Text Details */}
        <h3 className="text-lg font-extrabold text-slate-800 mb-1.5">{title}</h3>
        <p className="text-xs font-semibold text-slate-500 max-w-xs mb-6 px-1">
          {message}
        </p>

        {/* Buttons */}
        <div className="w-full space-y-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`w-full py-2.5 text-white font-bold rounded-xl shadow-md transition-all transform active:scale-[0.98] text-xs cursor-pointer flex items-center justify-center gap-1.5 ${styles.btnConfirm} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all transform active:scale-[0.98] text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}