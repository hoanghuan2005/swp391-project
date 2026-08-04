import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FilePreview from "./FilePreview";
import { getDocument } from "@/api/documentApi";

export default function DocumentPreviewModal({
  documentId,
  document: initialDoc,
  open,
  onOpenChange,
}) {
  const [doc, setDoc] = useState(initialDoc || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDoc) {
      setDoc(initialDoc);
      return;
    }

    if (documentId && open) {
      setLoading(true);
      getDocument(documentId)
        .then((fetchedDoc) => {
          setDoc(fetchedDoc);
        })
        .catch((err) => {
          console.error("Failed to load document preview detail:", err);
          setDoc(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [documentId, initialDoc, open]);

  const title = doc?.title || doc?.name || "Document Preview";
  const previewUrl = doc?.previewUrl || doc?.fileUrl || "";
  const downloadUrl = doc?.downloadUrl || doc?.fileUrl || previewUrl;
  const mimeType = doc?.mimeType || "";
  const originalFileName = doc?.originalFileName || doc?.name || title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col">
        <DialogHeader className="shrink-0 space-y-1 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2 truncate">
              <FileText className="w-5 h-5 text-[#f26522] shrink-0" />
              <span className="truncate">{title}</span>
            </DialogTitle>

            <div className="flex items-center gap-2 shrink-0">
              {doc?.id && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs font-semibold text-slate-600 hover:text-[#f26522] gap-1.5"
                >
                  <RouterLink to={`/documents/${doc.id}`} target="_blank">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Detail Page
                  </RouterLink>
                </Button>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Quick preview mode — read full document contents without leaving your AI chat workspace.
          </DialogDescription>
        </DialogHeader>

        {/* PREVIEW BODY */}
        <div className="flex-1 overflow-y-auto min-h-[350px] py-4">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#f26522]" />
              <span className="text-xs font-semibold">Loading file content...</span>
            </div>
          ) : (
            <FilePreview
              previewUrl={previewUrl}
              mimeType={mimeType}
              title={title}
              originalFileName={originalFileName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
