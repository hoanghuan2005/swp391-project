import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import DocumentReviews from "./DocumentReviews"; // Import component đánh giá
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Heart,
  FolderPlus,
  ShieldAlert,
  Trash2,
  GitBranch,
  History,
  Clock,
  User as UserIcon,
} from "lucide-react";
import FilePreview from "@/components/documents/FilePreview";
import { forceDownload } from "@/lib/downloadHelper";
import { recordDocumentView, reportDocument, downloadDocumentVersion } from "@/api/documentApi";
import AddToProjectModal from "@/components/projects/AddToProjectModal";
import UploadVersionDialog from "@/components/documents/UploadVersionDialog";

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function DocumentDetailView({
  documentId,
  fetchUrl,
  backTo,
  backLabel = "Back",
  headerTitle = "Document Detail",
  headerDescription = "Review the metadata and preview the uploaded file.",
}) {
  const isAdmin = window.location.pathname.startsWith("/admin");
  const navigate = useNavigate();
  const [documentDetail, setDocumentDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addToProjectOpen, setAddToProjectOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeConfirmOpen, setLikeConfirmOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [uploadVersionOpen, setUploadVersionOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axiosClient.get("/api/profile")
      .then((res) => {
        setCurrentUser(res.data);
      })
      .catch((e) => {
        console.error("Failed to load current user profile:", e);
      });
  }, []);

  const isOwnDocument =
    documentDetail?.uploadedBy?.id &&
    currentUser?.id &&
    documentDetail.uploadedBy.id === currentUser.id;

  const isUploaderAdmin = documentDetail?.uploadedBy?.roleName === "ADMIN";
  const canDeleteByAdmin = isAdmin && (!isUploaderAdmin || isOwnDocument);

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      toast.error("Please enter a reason for reporting!");
      return;
    }
    try {
      await reportDocument(documentId, reportReason);
      toast.success("Document reported successfully!");
      setReportOpen(false);
      setReportReason("");
    } catch (error) {
      console.error("Failed to report document:", error);
      toast.error(error.response?.data?.message || "Failed to submit report!");
    }
  };

  const handleDeleteDocByAdmin = async () => {
    if (confirm(`Are you sure you want to PERMANENTLY DELETE document "${documentDetail?.title}"?`)) {
      try {
        await axiosClient.delete(`/api/admin/documents/${documentId}`);
        toast.success("Document deleted successfully!");
        navigate("/admin/documents");
      } catch (err) {
        toast.error("Failed to delete document!");
      }
    }
  };

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token || !documentId) return;
      try {
        const res = await axiosClient.get("/api/documents/favorites");
        if (Array.isArray(res.data)) {
          const found = res.data.some((doc) => doc.id === documentId);
          setIsFavorited(found);
        }
      } catch (e) {
        if (e.response?.status !== 401) {
          console.error("Failed to check favorite status:", e);
        }
      }
    };
    checkFavoriteStatus();
  }, [documentId]);

  const handleToggleFavoriteClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to save documents!");
      return;
    }
    if (isFavorited) {
      performToggleFavorite(true);
    } else {
      setLikeConfirmOpen(true);
    }
  };

  const handleConfirmLike = async () => {
    setLikeConfirmOpen(false);
    await performToggleFavorite(false);
  };

  const performToggleFavorite = async (isRemoving) => {
    if (isRemoving) {
      setIsFavorited(false);
      toast.success("Removed from Library");
    } else {
      setIsFavorited(true);
      toast.success("Added to favorites successfully!");
    }

    try {
      await axiosClient.post(`/api/documents/${documentId}/favorite`);
    } catch (error) {
      setIsFavorited(isRemoving); // rollback
      if (error.response?.status === 401) {
        toast.error("Session expired, please log in again!");
      } else {
        toast.error("System error, failed to save document");
      }
    }
  };

  const handleDownloadFile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to download the document!");
      window.location.href = "/login";
      return;
    }
    try {
      await axiosClient.get(`/api/documents/${documentDetail.id}/download`);
      await forceDownload(documentDetail.downloadUrl, documentDetail.title || "document");
    } catch (error) {
      console.error("Failed to download:", error);
      alert("Error downloading file!");
    }
  };

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(fetchUrl);
        setDocumentDetail(response.data);
        if (response.data?.title) {
          document.title = `Mindocu | ${response.data.title}`;
        }
        if (documentId) recordDocumentView(documentId).catch(console.error);
      } catch (error) {
        console.error("Failed to load document detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (documentId && fetchUrl) loadDetail();
  }, [documentId, fetchUrl]);

  const previewUrl = documentDetail?.previewUrl || documentDetail?.fileUrl;
  const downloadUrl = documentDetail?.downloadUrl || documentDetail?.fileUrl;
  const mimeType = documentDetail?.mimeType || documentDetail?.fileType;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#f26522]" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">{documentDetail?.title || headerTitle}</h1>
            <p className="text-sm text-slate-500">{headerDescription}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {backTo && (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to={backTo}><ArrowLeft className="w-4 h-4 mr-2" />{backLabel}</Link>
            </Button>
          )}
          {downloadUrl && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl text-[#f26522] border-[#f26522]/20 hover:bg-[#f26522] hover:text-white"
                onClick={() => {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    toast.error("Please log in to save the document to your project!");
                    window.location.href = "/login";
                    return;
                  }
                  setAddToProjectOpen(true);
                }}
              >
                <FolderPlus className="w-4 h-4 mr-2" /> Save to Project
              </Button>
              <Button
                variant="outline"
                className={`rounded-xl transition-colors ${
                  isFavorited
                    ? "text-red-500 bg-red-50 hover:bg-red-100 border-red-100"
                    : "text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={handleToggleFavoriteClick}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                {isFavorited ? "Favorited" : "Favorite"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-emerald-600/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                onClick={() => {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    toast.error("Vui lòng đăng nhập để cập nhật phiên bản mới!");
                    window.location.href = "/login";
                    return;
                  }
                  setUploadVersionOpen(true);
                }}
              >
                <GitBranch className="w-4 h-4 mr-2" /> Upload Version mới
              </Button>
              <Button
                onClick={handleDownloadFile}
                className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
              {!isAdmin && !isOwnDocument && (
                <Button
                  variant="outline"
                  className="rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      toast.error("Please log in to report this document!");
                      window.location.href = "/login";
                      return;
                    }
                    setReportOpen(true);
                  }}
                >
                  <ShieldAlert className="w-4 h-4 mr-2" /> Report
                </Button>
              )}
              {canDeleteByAdmin && (
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={handleDeleteDocByAdmin}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Document
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700">Preview</CardTitle>
            <CardDescription>Supported formats will display here.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-[360px] w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <FilePreview
                previewUrl={previewUrl}
                mimeType={mimeType}
                originalFileName={documentDetail?.originalFileName}
                title={documentDetail?.title}
                height={420}
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700">Details</CardTitle>
            <CardDescription>File information and metadata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading || !documentDetail ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-5 w-3/4" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Title</p>
                  <p className="text-sm font-semibold text-slate-800">{documentDetail.title || "Untitled"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Description</p>
                  <p className="text-sm text-slate-600 line-clamp-4">{documentDetail.description || "No description."}</p>
                </div>
                <Separator />
                <div className="grid gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Uploaded by</span>
                    {documentDetail.uploadedBy?.id ? (
                      <Link
                        to={isAdmin ? `/admin/users/${documentDetail.uploadedBy.id}` : `/users/${documentDetail.uploadedBy.id}`}
                        className="font-semibold text-[#f26522] hover:text-[#d95316] hover:underline transition-colors"
                      >
                        {documentDetail.uploadedBy.username || documentDetail.uploadedBy.email || "User"}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-700">System</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Category</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">
                      {documentDetail.category ? `${documentDetail.category.code} - ${documentDetail.category.name}` : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Course</span>
                    <Badge variant="outline">{documentDetail.course?.code || "N/A"}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Visibility</span>
                    <Badge
                      className={
                        documentDetail.visibility === "PUBLIC"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
                      }
                      variant="outline"
                    >
                      {documentDetail.visibility || "PUBLIC"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">File size</span>
                    <span className="font-medium">{formatFileSize(documentDetail.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Version</span>
                    <Badge className="bg-[#f26522] text-white text-xs font-semibold px-2 py-0.5">
                      {documentDetail.currentVersionNumber || "v1.0"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Uploaded</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(documentDetail.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
                {documentDetail.tags && documentDetail.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-1.5">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {documentDetail.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-2 py-0.5"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KHU VỰC HIỂN THỊ LỊCH SỬ PHIÊN BẢN (VERSION HISTORY) */}
      {!loading && documentDetail?.versions && documentDetail.versions.length > 0 && (
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                <History className="w-5 h-5 text-[#f26522]" />
                Lịch sử phiên bản (Version History)
              </CardTitle>
              <CardDescription>
                Các bản cập nhật và ghi chú sửa đổi của tài liệu này
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-emerald-600/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              onClick={() => {
                const token = localStorage.getItem("token");
                if (!token) {
                  toast.error("Vui lòng đăng nhập để cập nhật phiên bản mới!");
                  window.location.href = "/login";
                  return;
                }
                setUploadVersionOpen(true);
              }}
            >
              <GitBranch className="w-4 h-4 mr-2" /> Upload Version mới
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="divide-y divide-slate-100">
              {documentDetail.versions.map((ver, idx) => (
                <div key={ver.id || idx} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#f26522] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {ver.versionNumber || "v1.0"}
                      </Badge>
                      {idx === 0 && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Bản mới nhất (Active)
                        </Badge>
                      )}
                      <span className="text-sm font-semibold text-slate-800">
                        {ver.originalFileName || documentDetail.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({formatFileSize(ver.fileSize)})
                      </span>
                    </div>

                    {ver.changelog && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1.5 italic">
                        "{ver.changelog}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <UserIcon size={12} /> {ver.uploaderName || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(ver.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 text-xs"
                    onClick={async () => {
                      try {
                        const res = await downloadDocumentVersion(documentId, ver.id);
                        if (res?.downloadUrl) {
                          await forceDownload(res.downloadUrl, ver.originalFileName || `document_${ver.versionNumber}`);
                        }
                      } catch (err) {
                        toast.error("Tải phiên bản này thất bại!");
                      }
                    }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Tải bản này
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KHU VỰC HIỂN THỊ ĐÁNH GIÁ (REVIEWS) */}
      {!loading && documentId && (
        <DocumentReviews documentId={documentId} uploadedById={documentDetail?.uploadedBy?.id} />
      )}

      <UploadVersionDialog
        open={uploadVersionOpen}
        onOpenChange={setUploadVersionOpen}
        documentId={documentId}
        documentTitle={documentDetail?.title}
        onSuccess={(updatedDetail) => {
          if (updatedDetail) {
            setDocumentDetail(updatedDetail);
          }
        }}
      />

      <AddToProjectModal
        open={addToProjectOpen}
        onOpenChange={setAddToProjectOpen}
        documentId={documentId}
      />

      <Dialog open={likeConfirmOpen} onOpenChange={setLikeConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              Add to Favorites
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Are you sure you want to add <strong>"{documentDetail?.title}"</strong> to your favorites?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setLikeConfirmOpen(false);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLike}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-semibold"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Report Document
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Please let us know the reason you are reporting <strong>"{documentDetail?.title}"</strong>:
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#f26522] text-sm"
              placeholder="Enter the reason (e.g. spam, fake content, copyright violation...)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setReportOpen(false);
                setReportReason("");
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}