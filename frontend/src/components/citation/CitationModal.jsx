import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { FileText, ExternalLink, Quote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function CitationModal({ citation, open, onOpenChange, onPreviewDocument }) {
  if (!citation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-black text-[#f26522] bg-orange-100 border border-orange-200 rounded-lg">
              Source [{citation.index || 1}]
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Citation Verification
            </span>
          </div>

          <DialogTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2 leading-snug">
            <FileText className="w-5 h-5 text-[#f26522] shrink-0" />
            <span className="truncate">{citation.title || "Document Source"}</span>
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500">
            Below is the original excerpt retrieved from this document used by MinDocu AI to synthesize the response.
          </DialogDescription>
        </DialogHeader>

        {/* EXCERPT CONTENT */}
        <div className="my-4 relative">
          <div className="p-4 bg-orange-50/60 border-l-4 border-[#f26522] rounded-r-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-[#f26522] font-bold text-[11px] uppercase tracking-wider">
              <Quote className="w-3.5 h-3.5" />
              Document Excerpt
            </div>
            <p className="text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-1">
              {citation.excerpt || "No excerpt text available for this source."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200 text-xs font-semibold"
          >
            Close
          </Button>

          {citation.documentId && (
            <div className="flex items-center gap-2">
              {onPreviewDocument ? (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onPreviewDocument(citation.documentId, citation.title);
                  }}
                  className="bg-[#f26522] hover:bg-[#e45a1b] text-white rounded-xl text-xs font-semibold gap-1.5 shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Quick Preview File
                </Button>
              ) : (
                <Button
                  asChild
                  className="bg-[#f26522] hover:bg-[#e45a1b] text-white rounded-xl text-xs font-semibold gap-1.5 shadow-sm"
                >
                  <RouterLink to={`/documents/${citation.documentId}`}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Full Document
                  </RouterLink>
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
