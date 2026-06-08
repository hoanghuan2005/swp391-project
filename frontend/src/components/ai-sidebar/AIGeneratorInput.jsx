import {
  FileText,
  X,
  Plus,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIGeneratorInput({
  value,
  onChange,
  placeholder,
  fileInputRef,
  handleFileSelect,
  activeDocument,
  clearDocument,
  onGenerate,
  isGenerating,
  disabled,
  footerLeft,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full
          min-h-[180px]
          resize-none
          border-0
          outline-none
          bg-transparent
          p-5
          text-slate-700
        "
      />

      {activeDocument && (
        <div className="px-5 pb-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
            <FileText className="w-4 h-4 text-[#f26522]" />

            <span className="max-w-[220px] truncate text-sm">
              {activeDocument.title || activeDocument.name}
            </span>

            <button onClick={clearDocument}>
              <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full"
          >
            <Plus className="w-5 h-5" />
          </Button>

          {footerLeft}
        </div>

        <Button
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-[#f26522]
            text-white
            hover:bg-[#de5b0b]
            disabled:opacity-50
          "
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}