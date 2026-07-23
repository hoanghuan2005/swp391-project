import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import {
  generateQuizHTML,
  generateFlashcardHTML,
  downloadWord,
  downloadPDF,
} from "@/utils/exportUtils";
import { toast } from "react-hot-toast";

export default function ExportModal({ open, onOpenChange, type = "quiz", data }) {
  const [format, setFormat] = useState("word"); // "word" | "pdf"
  const [answerMode, setAnswerMode] = useState("separate"); // "none" | "separate" | "inline"
  const [isExporting, setIsExporting] = useState(false);

  if (!data) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const title = data.title || data.name || data.topic || (type === "quiz" ? "Quiz" : "Flashcard");

      if (format === "word") {
        await downloadWord(title, data, type, answerMode);
        toast.success(`Word document (${title}.docx) exported successfully!`);
      } else {
        let htmlContent = "";
        if (type === "quiz") {
          htmlContent = generateQuizHTML(data, answerMode);
        } else {
          htmlContent = generateFlashcardHTML(data);
        }
        await downloadPDF(title, htmlContent);
        toast.success(`PDF document (${title}.pdf) exported successfully!`);
      }

      onOpenChange(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export document.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-[#f26522]" />
            Export {type === "quiz" ? "Quiz Assessment" : "Flashcard Set"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-1">
            Select format and options to download your study material.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format Selection */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              1. SELECT EXPORT FORMAT
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("word")}
                disabled={isExporting}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                  format === "word"
                    ? "border-[#f26522] bg-orange-50/60 text-slate-900 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                  W
                </div>
                <div>
                  <div className="font-bold text-sm">Microsoft Word</div>
                  <div className="text-xs text-slate-400">Standard .docx file</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("pdf")}
                disabled={isExporting}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                  format === "pdf"
                    ? "border-[#f26522] bg-orange-50/60 text-slate-900 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                  PDF
                </div>
                <div>
                  <div className="font-bold text-sm">PDF Document</div>
                  <div className="text-xs text-slate-400">Direct .pdf download</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quiz Answer Options */}
          {type === "quiz" && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                2. ANSWER DISPLAY OPTIONS
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAnswerMode("separate")}
                  disabled={isExporting}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                    answerMode === "separate"
                      ? "border-[#f26522] bg-orange-50/50 text-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="answerMode"
                    checked={answerMode === "separate"}
                    onChange={() => setAnswerMode("separate")}
                    disabled={isExporting}
                    className="mt-1 accent-[#f26522]"
                  />
                  <div>
                    <div className="font-semibold text-sm text-slate-800">
                      Append Answer Key at End ⭐ (Recommended)
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Questions are on the first pages. Answer key and explanations are placed at the end.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAnswerMode("none")}
                  disabled={isExporting}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                    answerMode === "none"
                      ? "border-[#f26522] bg-orange-50/50 text-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="answerMode"
                    checked={answerMode === "none"}
                    onChange={() => setAnswerMode("none")}
                    disabled={isExporting}
                    className="mt-1 accent-[#f26522]"
                  />
                  <div>
                    <div className="font-semibold text-sm text-slate-800">
                      Exclude Answers (Practice Exam)
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Includes title, description, and questions only for self-testing.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAnswerMode("inline")}
                  disabled={isExporting}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                    answerMode === "inline"
                      ? "border-[#f26522] bg-orange-50/50 text-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="answerMode"
                    checked={answerMode === "inline"}
                    onChange={() => setAnswerMode("inline")}
                    disabled={isExporting}
                    className="mt-1 accent-[#f26522]"
                  />
                  <div>
                    <div className="font-semibold text-sm text-slate-800">
                      Show Answers & Explanations Inline
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Marks correct answers ✔ and shows explanation boxes directly below each question.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Flashcard Format Note */}
          {type === "flashcard" && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#f26522] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800 block mb-0.5">2-Column Table Format:</span>
                Flashcards will be exported in a clean 2-column layout: <strong>Term</strong> and <strong>Definition / Explanation</strong> for easy printing and studying.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-3 sm:gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="rounded-xl border-slate-200 cursor-pointer px-5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#f26522] hover:bg-[#d95316] text-white font-medium rounded-xl gap-2 shadow-md shadow-orange-500/20 cursor-pointer min-w-[140px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export ({format.toUpperCase()})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
