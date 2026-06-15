import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date) {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return past.toLocaleDateString("en-GB");
}

export function getFileExtension(doc) {
  if (!doc) return "DOC";
  if (doc.fileType) {
    const type = doc.fileType.toLowerCase();
    if (type.includes("wordprocessingml") || type.includes("docx")) return "DOCX";
    if (type.includes("spreadsheetml") || type.includes("xlsx")) return "XLSX";
    if (type.includes("presentationml") || type.includes("pptx")) return "PPTX";
    if (type.includes("pdf")) return "PDF";
    return type.toUpperCase();
  }
  
  const filename = doc.originalFileName || doc.title || "";
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx > -1 && dotIdx < filename.length - 1) {
    const ext = filename.substring(dotIdx + 1).toLowerCase();
    if (["docx", "doc", "pdf", "xlsx", "xls", "pptx", "ppt"].includes(ext)) {
      return ext.toUpperCase();
    }
  }

  if (doc.mimeType) {
    const mime = doc.mimeType.toLowerCase();
    if (mime.includes("pdf")) return "PDF";
    if (mime.includes("word") || mime.includes("officedocument.wordprocessingml") || mime.includes("msword")) return "DOCX";
    if (mime.includes("excel") || mime.includes("officedocument.spreadsheetml") || mime.includes("ms-excel")) return "XLSX";
    if (mime.includes("powerpoint") || mime.includes("officedocument.presentationml") || mime.includes("ms-powerpoint")) return "PPTX";
    const parts = mime.split("/");
    if (parts.length > 1) {
      const part = parts[1];
      if (part.includes("wordprocessingml") || part.includes("document")) return "DOCX";
      return part.toUpperCase();
    }
  }
  
  return "DOC";
}

