import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, FileText, GitBranch } from "lucide-react";
import { uploadNewVersion } from "@/api/documentApi";
import { toast } from "sonner";

export default function UploadVersionDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  onSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [changelog, setChangelog] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setChangelog("");
    setUploading(false);
    onOpenChange(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to update");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading new version...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (changelog.trim()) {
        formData.append("changelog", changelog.trim());
      }

      const response = await uploadNewVersion(documentId, formData);
      toast.success("New version uploaded successfully!", { id: toastId });
      onSuccess?.(response);
      handleClose();
    } catch (error) {
      console.error("Failed to upload version", error);
      toast.error(
        error.response?.data?.message || "Failed to upload new version!",
        { id: toastId }
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <GitBranch className="text-[#f26522]" size={22} />
            Upload New Version
          </DialogTitle>
          <DialogDescription>
            Upload a revision or addendum for document{" "}
            <span className="font-semibold text-slate-800">
              "{documentTitle || "Document"}"
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* File input */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-slate-700">
              New attached file <span className="text-red-500">*</span>
            </Label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-[#f26522]/10 rounded-full text-[#f26522]">
                  <UploadCloud size={28} />
                </div>
              </div>
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-slate-800 font-medium">
                  <FileText size={18} className="text-[#f26522]" />
                  <span className="truncate max-w-[300px]">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Click here to choose a new file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF, DOCX, PPTX formats...
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Changelog */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-slate-700">
              Changelog notes
            </Label>
            <Textarea
              placeholder="e.g. Fixed typos in Chapter 2, added exam solutions for 2025..."
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              rows={3}
              className="rounded-xl border-slate-200 focus:border-[#f26522] focus:ring-[#f26522]"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || uploading}
              className="bg-[#f26522] hover:bg-[#d9531e] text-white rounded-xl"
            >
              {uploading ? "Uploading..." : "Upload New Version"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
