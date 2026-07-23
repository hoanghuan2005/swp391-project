import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  History,
  GitBranch,
  Download,
  User as UserIcon,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { downloadDocumentVersion, approveDocumentVersion, rejectDocumentVersion } from "@/api/documentApi";
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
  isOwner = false,
  onUploadNewVersion,
  onRefresh,
}) {
  const [processingId, setProcessingId] = useState(null);
  const [rejectDialogVer, setRejectDialogVer] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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

  const handleApprove = async (ver) => {
    setProcessingId(ver.id);
    try {
      await approveDocumentVersion(documentId, ver.id);
      toast.success(`Version ${ver.versionNumber} approved successfully!`);
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve version");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectDialogVer) return;
    setProcessingId(rejectDialogVer.id);
    try {
      await rejectDocumentVersion(documentId, rejectDialogVer.id, rejectReason);
      toast.success(`Version ${rejectDialogVer.versionNumber} rejected.`);
      setRejectDialogVer(null);
      setRejectReason("");
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject version");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
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
              versions.map((ver, idx) => {
                const status = ver.status || "APPROVED";
                const isPending = status === "PENDING_APPROVAL";
                const isRejected = status === "REJECTED";
                const isApproved = status === "APPROVED";

                return (
                  <div
                    key={ver.id || idx}
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                      isPending
                        ? "border-amber-200 bg-amber-50/40"
                        : isRejected
                        ? "border-rose-100 bg-rose-50/20"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Header line: Badges + Title + Size on left, Download on right */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <Badge className="bg-[#f26522] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                            {ver.versionNumber || "v1.0"}
                          </Badge>
                          
                          {idx === 0 && isApproved && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] px-2 py-0.5 font-medium shrink-0"
                            >
                              Active Version
                            </Badge>
                          )}

                          {isPending && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] px-2 py-0.5 font-medium flex items-center gap-1 shrink-0">
                              <AlertCircle size={12} /> Pending Approval
                            </Badge>
                          )}

                          {isRejected && (
                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[11px] px-2 py-0.5 font-medium flex items-center gap-1 shrink-0">
                              <XCircle size={12} /> Rejected
                            </Badge>
                          )}

                          <span className="text-sm font-semibold text-slate-800">
                            {ver.originalFileName || documentTitle}
                          </span>
                          {ver.fileSize && (
                            <span className="text-xs text-slate-400 shrink-0">
                              ({formatFileSize(ver.fileSize)})
                            </span>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 text-xs shrink-0 self-start sm:self-center -mt-6"
                          onClick={() => handleDownload(ver)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                        </Button>
                      </div>

                      {ver.changelog && (
                        <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100 italic">
                          "{ver.changelog}"
                        </p>
                      )}

                      {isRejected && ver.rejectionReason && (
                        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 font-medium">
                          Reason for rejection: {ver.rejectionReason}
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
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions for Owner when version is PENDING_APPROVAL */}
                    {isPending && isOwner && (
                      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-end gap-2">
                        <span className="text-xs text-amber-800 font-medium mr-auto">
                          Requires your approval as document owner:
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 h-8 rounded-lg text-xs"
                          disabled={processingId === ver.id}
                          onClick={() => {
                            setRejectDialogVer(ver);
                            setRejectReason("");
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 rounded-lg text-xs font-semibold"
                          disabled={processingId === ver.id}
                          onClick={() => handleApprove(ver)}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & Activate
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectDialogVer} onOpenChange={(val) => !val && setRejectDialogVer(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Reject Version {rejectDialogVer?.versionNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Optionally enter a reason to inform the uploader ({rejectDialogVer?.uploaderName}) why this version is rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="e.g., File content is incomplete or incorrect..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="rounded-xl text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setRejectDialogVer(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
              onClick={handleRejectSubmit}
              disabled={!!processingId}
            >
              Confirm Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
