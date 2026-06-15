import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
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
  Globe,
  Image as ImageIcon,
  Music,
  Video,
  Heart,
  FolderPlus,
} from "lucide-react";
import FilePreview from "@/components/documents/FilePreview";
import { forceDownload } from "@/lib/downloadHelper";
import { recordDocumentView } from "@/api/documentApi";
import AddToProjectModal from "@/components/projects/AddToProjectModal";

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
  const [documentDetail, setDocumentDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addToProjectOpen, setAddToProjectOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeConfirmOpen, setLikeConfirmOpen] = useState(false);

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
      alert("Vui lòng đăng nhập để tải tài liệu!");
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
                    alert("Vui lòng đăng nhập để lưu tài liệu vào dự án!");
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
                onClick={handleDownloadFile}
                className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] cursor-pointer"
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
                    <span className="text-slate-500">Course</span>
                    <Badge variant="outline">{documentDetail.course?.code || "N/A"}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">File size</span>
                    <span className="font-medium">{formatFileSize(documentDetail.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Uploaded</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(documentDetail.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
