import React, { useMemo } from "react";
import { FileText } from "lucide-react";
import PdfViewer from "./PdfViewer";

const resolvePreviewType = ({ mimeType, previewUrl, originalFileName }) => {
  const safeMimeType = mimeType || "";
  if (safeMimeType.startsWith("image/")) return "image";
  if (safeMimeType.startsWith("video/")) return "video";
  if (safeMimeType === "application/pdf") return "pdf";
  if (
    safeMimeType.includes("officedocument.wordprocessingml") ||
    safeMimeType.includes("officedocument.presentationml") ||
    safeMimeType.includes("officedocument.spreadsheetml") ||
    safeMimeType.includes("msword") ||
    safeMimeType.includes("ms-powerpoint") ||
    safeMimeType.includes("ms-excel")
  ) {
    return "office";
  }

  const fallbackName = (originalFileName || previewUrl || "").toLowerCase();
  if (fallbackName.endsWith(".pdf")) return "pdf";
  if (fallbackName.match(/\.(png|jpe?g|gif|webp)$/)) return "image";
  if (fallbackName.match(/\.(mp4|mov|webm)$/)) return "video";
  if (fallbackName.match(/\.(docx|pptx|xlsx)$/)) return "office";

  return "other";
};

const toOfficeViewerUrl = (fileUrl) => {
  if (!fileUrl) {
    return "";
  }

  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
};

const fixCloudinaryPdfUrl = (url) => {
  if (!url) return url;
  if (typeof url === "string" && (url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("pdf")) && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/raw/upload/");
  }
  return url;
};

export default function FilePreview({
  previewUrl,
  mimeType,
  title,
  originalFileName,
  height = 420,
}) {
  const safePreviewUrl = useMemo(() => fixCloudinaryPdfUrl(previewUrl), [previewUrl]);

  const previewType = useMemo(
    () => resolvePreviewType({ mimeType, previewUrl: safePreviewUrl, originalFileName }),
    [mimeType, safePreviewUrl, originalFileName],
  );

  if (!safePreviewUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <FileText className="h-8 w-8 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Preview not available
          </p>
          <p className="text-xs text-slate-500">
            Use the download button to view this file.
          </p>
        </div>
      </div>
    );
  }

  if (previewType === "image") {
    return (
      <img
        src={safePreviewUrl}
        alt={title || "Document preview"}
        className="w-full max-h-[420px] object-contain rounded-xl border border-slate-100 bg-white"
      />
    );
  }

  if (previewType === "pdf") {
    return (
      <div className="w-full">
        <PdfViewer url={safePreviewUrl} />
      </div>
    );
  }

  if (previewType === "office") {
    return (
      <iframe
        title="Office preview"
        src={toOfficeViewerUrl(previewUrl)}
        style={{ height: "100vh" }}
        className="w-full rounded-xl border border-slate-100"
      />
    );
  }

  if (previewType === "video") {
    return (
      <video controls className="w-full rounded-xl border border-slate-100">
        <source src={previewUrl} />
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <FileText className="h-8 w-8 text-slate-400" />
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Preview not available
        </p>
        <p className="text-xs text-slate-500">
          Use the download button to view this file.
        </p>
      </div>
    </div>
  );
}
