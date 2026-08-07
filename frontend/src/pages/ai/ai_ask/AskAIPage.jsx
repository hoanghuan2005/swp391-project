import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import axiosClient from "@/api/axiosClient";
import useDocuments from "@/hooks/useDocuments";
import useDocumentQuota from "@/hooks/useDocumentQuota";
import useAiUsage from "@/hooks/useAiUsage";
import { isDocumentQuotaExceeded } from "@/api/documentQuotaApi";
import QuotaExceededDialog from "@/components/quota/QuotaExceededDialog";
import UnifiedAIChat from "@/components/ai-chat/UnifiedAIChat";
import AiUsageBadge from "@/components/ai-usage/AiUsageBadge";

export default function AskAIPage() {
  const { documents, refreshDocuments } = useDocuments();
  const { refreshDocumentQuota } = useDocumentQuota();
  const [isUploading, setIsUploading] = useState(false);
  const [quotaDialog, setQuotaDialog] = useState({
    open: false,
    type: "DOCUMENT",
    message: "",
  });

  const {
    planName,
    remainingUsage,
    isUnlimited,
    tierLimits,
    loading: aiUsageLoading,
  } = useAiUsage();

  const fileInputRef = useRef(null);

  // Prevent parent container from scrolling while workspace is mounted
  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      const originalOverflow = mainElement.style.overflow;
      mainElement.style.overflow = "hidden";
      return () => {
        mainElement.style.overflow = originalOverflow;
      };
    }
  }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    const toastId = toast.loading("Uploading document...");
    try {
      setIsUploading(true);
      await axiosClient.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully!", { id: toastId });
      refreshDocuments();
      refreshDocumentQuota();
    } catch (error) {
      console.error("Failed to upload document:", error);
      if (isDocumentQuotaExceeded(error)) {
        toast.dismiss(toastId);
        const message = error.response?.data?.message;
        const isStorage =
          message?.toLowerCase().includes("storage") ||
          message?.toLowerCase().includes("lưu trữ") ||
          message?.toLowerCase().includes("dung lượng");
        setQuotaDialog({
          open: true,
          type: isStorage ? "STORAGE" : "DOCUMENT",
          message,
        });
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to upload document",
        { id: toastId },
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] flex overflow-hidden bg-[#fafafa] rounded-b-xl -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
      />
      <UnifiedAIChat
        mode="PERSONAL"
        documents={documents}
        onRefreshDocuments={refreshDocuments}
        maxSelectedDocs={tierLimits?.maxSelectedDocs || 2}
        showUploadButton={true}
        fileInputRef={fileInputRef}
        handleUpload={handleUpload}
        isUploading={isUploading}
        rightElement={
          <AiUsageBadge
            planName={planName}
            remainingUsage={remainingUsage}
            isUnlimited={isUnlimited}
            loading={aiUsageLoading}
          />
        }
      />

      <QuotaExceededDialog
        open={quotaDialog.open}
        onOpenChange={(open) =>
          setQuotaDialog((current) => ({ ...current, open }))
        }
        type={quotaDialog.type}
        message={quotaDialog.message}
      />
    </div>
  );
}