import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  GitBranch,
  Download,
  User as UserIcon,
  Clock,
  FileText,
} from "lucide-react";
import { downloadDocumentVersion } from "@/api/documentApi";
import { toast } from "sonner";

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

async function forceDownload(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    window.open(url, "_blank");
  }
}

export default function VersionHistoryModal({
  open,
  onOpenChange,
  versions = [],
  documentTitle = "",
  documentId,
  onUploadNewVersion,
}) {
  const handleDownload = async (ver) => {
    try {
      const res = await downloadDocumentVersion(documentId, ver.id);
      if (res?.downloadUrl) {
        await forceDownload(
          res.downloadUrl,
          ver.originalFileName || `document_${ver.versionNumber}`
        );
      }
    } catch (err) {
      toast.error("Failed to download this version!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl p-6 max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 pr-6">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-[#f26522]" />
              Version History
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Revisions and changelog history for document{" "}
              <span className="font-medium text-slate-700">
                "{documentTitle || "document"}"
              </span>
            </DialogDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-emerald-600/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 shrink-0"
            onClick={() => {
              onOpenChange(false);
              onUploadNewVersion?.();
            }}
          >
            <GitBranch className="w-4 h-4" />
            Upload New Version
          </Button>
        </DialogHeader>

        {/* Modal Body / Version List */}
        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-300" />
              No version history available for this document.
            </div>
          ) : (
            versions.map((ver, idx) => (
              <div
                key={ver.id || idx}
                className="p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#f26522] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {ver.versionNumber || "v1.0"}
                    </Badge>
                    {idx === 0 && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] px-2 py-0.5 font-medium"
                      >
                        Latest (Active)
                      </Badge>
                    )}
                    <span className="text-sm font-semibold text-slate-800">
                      {ver.originalFileName || documentTitle}
                    </span>
                    {ver.fileSize && (
                      <span className="text-xs text-slate-400">
                        ({formatFileSize(ver.fileSize)})
                      </span>
                    )}
                  </div>

                  {ver.changelog && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{ver.changelog}"
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <UserIcon size={13} /> {ver.uploaderName || "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />{" "}
                      {new Date(ver.createdAt).toLocaleString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 text-xs shrink-0 self-start md:self-center"
                  onClick={() => handleDownload(ver)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download version
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
