import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import FilePreview from "@/components/documents/FilePreview";
import { forceDownload } from "@/lib/downloadHelper";

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) {
    return "-";
  }
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
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

  const handleDownloadFile = async () => {
    try {
      await axiosClient.get(`/api/documents/${documentDetail.id}/download`);
      await forceDownload(
        documentDetail.downloadUrl,
        documentDetail.title || "document",
      );
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
      } catch (error) {
        console.error("Failed to load document detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (documentId && fetchUrl) {
      loadDetail();
    }
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              {headerTitle}
            </h1>
            <p className="text-sm text-slate-500">{headerDescription}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {backTo && (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to={backTo}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel}
              </Link>
            </Button>
          )}
          {downloadUrl && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl text-[#f26522] border-[#f26522]/20 hover:bg-[#f26522] hover:text-white"
                onClick={() => alert("Added to favorites!")}
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorite
              </Button>
              <Button
                onClick={handleDownloadFile}
                className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700">Preview</CardTitle>
            <CardDescription>
              Supports images, PDF, audio, video, and Office files. Other
              formats open in a new tab.
            </CardDescription>
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
            <CardDescription>
              File information, tags, and visibility status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading || !documentDetail ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Title
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {documentDetail.title || "Untitled document"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Description
                  </p>
                  <p className="text-sm text-slate-600">
                    {documentDetail.description || "No description provided."}
                  </p>
                </div>

                <Separator />

                <div className="grid gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Course</span>
                    <Badge
                      variant="outline"
                      className="border-slate-200 text-slate-600"
                    >
                      {documentDetail.course?.code || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Visibility</span>
                    <Badge className="bg-slate-100 text-slate-600">
                      {documentDetail.visibility || "-"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">File size</span>
                    <span className="font-medium text-slate-700">
                      {formatFileSize(documentDetail.fileSize)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Downloads</span>
                    <span className="font-medium text-slate-700">
                      {documentDetail.downloadCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Uploaded</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {documentDetail.createdAt
                        ? new Date(documentDetail.createdAt).toLocaleDateString(
                            "en-GB",
                          )
                        : "-"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Uploader
                  </p>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-700">
                      {documentDetail.uploadedBy?.username || "Unknown user"}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {documentDetail.uploadedBy?.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {documentDetail.tags?.length ? (
                      documentDetail.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-slate-200 text-slate-600"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        No tags assigned.
                      </span>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    Image
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    PDF
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4 text-slate-400" />
                    Video
                  </span>
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4 text-slate-400" />
                    Audio
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4 text-slate-400" />
                    Office/Other
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
