import { ChevronLeft } from "lucide-react";

export default function AIToolHeader({
  icon: Icon,
  title,
  description,
  rightElement,
  onBack,
}) {
  return (
    <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100 gap-4">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5 text-[#f26522]">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:text-[#f26522] transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {Icon && <Icon className="w-5 h-5 text-[#f26522] shrink-0" />}
          <h1 className="text-xl font-bold text-slate-800 tracking-tight truncate">
            {title}
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>
      {rightElement && (
        <div className="shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  );
}

