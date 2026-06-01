import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand={false}
      visibleToasts={4}
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "rounded-2xl border border-slate-200 bg-white shadow-xl",

          title: "text-sm font-semibold text-slate-800",

          description: "text-xs text-slate-500",

          actionButton: "bg-[#f26522] text-white",

          cancelButton: "bg-slate-100 text-slate-700",
        },
      }}
    />
  );
}
