import React, { useState } from "react";
import {
  FileText,
  X,
  Plus,
  Send,
  Loader2,
  UploadCloud,
  Sparkles,
  BookOpen,
  ArrowRight,
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
  hideTextTab = false,
}) {
  const [activeTab, setActiveTab] = useState(activeDocument ? "document" : "text");

  // Sync active tab if activeDocument becomes available
  React.useEffect(() => {
    if (activeDocument) {
      setActiveTab("document");
    }
  }, [activeDocument]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300">
      {/* Tab Switcher */}
      {!hideTextTab && (
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("document")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "document"
                ? "bg-white text-[#f26522] shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Upload File / Library</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "text"
                ? "bg-white text-[#f26522] shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Paste Study Notes</span>
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {(activeTab === "document" || hideTextTab) ? (
          <div>
            {activeDocument ? (
              /* Beautiful active document preview card */
              <div className="relative group flex items-center justify-between border-2 border-orange-100 bg-gradient-to-br from-[#fffaf7] to-[#fff6f0]/40 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-[#f26522] shrink-0 shadow-sm relative">
                    <FileText className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white"></span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-800 truncate pr-2">
                      {activeDocument.title || activeDocument.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                      <span>Ready to generate study materials</span>
                      <span className="text-[#f26522] font-semibold">•</span>
                      <span className="text-emerald-600 font-semibold">Active</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearDocument}
                  className="w-8 h-8 rounded-full bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all shadow-sm cursor-pointer border border-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Premium upload zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center border-2 border-dashed border-orange-200/60 bg-[#fffdfb]/60 hover:bg-[#fff9f4]/80 hover:border-[#f26522] rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-50 group-hover:bg-[#f26522]/10 flex items-center justify-center text-[#f26522] mb-4 shadow-sm transition-all duration-300 group-hover:scale-110">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-700 group-hover:text-slate-800 transition-colors">
                  Drag & drop file here, or click to upload
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed font-semibold">
                  Supports PDF, DOCX, TXT. Or select a document from the left sidebar library.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Text area */
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50/30 p-2 focus-within:border-[#f26522] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#f26522]/5 transition-all">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[150px] resize-none border-0 outline-none bg-transparent p-3 text-sm text-slate-700 placeholder-slate-400 leading-relaxed font-medium"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          {footerLeft}
        </div>

        <Button
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="flex h-11 px-5 items-center justify-center gap-2 rounded-full bg-[#f26522] text-white hover:bg-[#de5b0b] disabled:opacity-50 font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>Generate AI Material</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}