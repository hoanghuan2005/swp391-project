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
  ChevronLeft,
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
import VersionHistoryModal from "@/components/documents/VersionHistoryModal";

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
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") return;
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
      if (localStorage.getItem("isLoggedIn") !== "true" || !documentId) return;
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
    if (localStorage.getItem("isLoggedIn") !== "true") {
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
    if (localStorage.getItem("isLoggedIn") !== "true") {
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
        <div className="flex items-center gap-3 mb-3">
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-[#f26522] shadow-none"
              title={backLabel || "Go back"}
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </Link>
          )}
          <FileText className="w-8 h-8 text-[#f26522] shrink-0" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">{documentDetail?.title || headerTitle}</h1>
              {documentDetail?.versions && documentDetail.versions.length > 0 && (
                <Badge
                  className="bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522]/20 cursor-pointer border-none text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold transition-colors"
                  title="Click to view Version History"
                  onClick={() => setVersionHistoryOpen(true)}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  {documentDetail.versions[0]?.versionNumber || "v1.0"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500">{headerDescription}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {downloadUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => setVersionHistoryOpen(true)}
              >
                <History className="w-4 h-4 mr-1 text-[#f26522]" />
                Version History
                {documentDetail?.versions && documentDetail.versions.length > 0 && (
                  <Badge className="ml-1.5 bg-[#f26522]/10 text-[#f26522] border-none text-[10px] px-1.5 py-0.2 hover:bg-[#f26522]/20 font-semibold">
                    {documentDetail.versions.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl text-[#f26522] border-[#f26522]/20 hover:bg-[#f26522] hover:text-white"
                onClick={() => {
                  if (localStorage.getItem("isLoggedIn") !== "true") {
                    toast.error("Please log in to save the document to your project!");
                    window.location.href = "/login";
                    return;
                  }
                  setAddToProjectOpen(true);
                }}
              >
                <FolderPlus className="w-4 h-4 mr-1" /> Save to Project
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
                <Heart className={`w-4 h-4 mr-1 ${isFavorited ? "fill-current" : ""}`} />
                {isFavorited ? "Favorited" : "Favorite"}
              </Button>
              {!isAdmin && !isOwnDocument && (
                <Button
                  variant="outline"
                  className="rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    if (localStorage.getItem("isLoggedIn") !== "true") {
                      toast.error("Please log in to report this document!");
                      window.location.href = "/login";
                      return;
                    }
                    setReportOpen(true);
                  }}
                >
                  <ShieldAlert className="w-4 h-4 mr-1" /> Report
                </Button>
              )}
              {canDeleteByAdmin && (
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={handleDeleteDocByAdmin}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete Document
                </Button>
              )}
              <Button
                onClick={handleDownloadFile}
                className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] cursor-pointer shadow-sm ml-1"
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
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
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {documentDetail.category ? `${documentDetail.category.code} - ${documentDetail.category.name}` : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Course</span>
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {documentDetail.course?.code || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Visibility</span>
                    <Badge
                      className={
                        documentDetail.visibility === "PUBLIC"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      }
                      variant="outline"
                    >
                      {documentDetail.visibility || "PUBLIC"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">File size</span>
                    <span className="font-medium text-slate-800">{formatFileSize(documentDetail.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Version</span>
                    <Badge
                      className="bg-[#f26522]/10 text-[#f26522] border-none hover:bg-[#f26522]/20 font-semibold text-xs px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                      onClick={() => setVersionHistoryOpen(true)}
                      title="Click to view Version History"
                    >
                      <GitBranch className="w-3 h-3 mr-1 inline" />
                      {documentDetail.currentVersionNumber || "v1.0"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Uploaded</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
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

      {/* REVIEWS SECTION */}
      {!loading && documentId && (
        <DocumentReviews documentId={documentId} uploadedById={documentDetail?.uploadedBy?.id} />
      )}

      <VersionHistoryModal
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        versions={documentDetail?.versions || []}
        documentTitle={documentDetail?.title}
        documentId={documentId}
        onUploadNewVersion={() => {
          if (localStorage.getItem("isLoggedIn") !== "true") {
            toast.error("Please log in to upload a new version!");
            window.location.href = "/login";
            return;
          }
          setUploadVersionOpen(true);
        }}
      />

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