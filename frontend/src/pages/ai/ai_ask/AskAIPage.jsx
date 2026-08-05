import { useRef, useState } from "react";
import { toast } from "sonner";
import axiosClient from "@/api/axiosClient";
import useDocuments from "@/hooks/useDocuments";
import useAiUsage from "@/hooks/useAiUsage";
import useDocumentQuota from "@/hooks/useDocumentQuota";
import { isDocumentQuotaExceeded } from "@/api/documentQuotaApi";
import AiUsageBadge from "@/components/ai-usage/AiUsageBadge";
import QuotaExceededDialog from "@/components/quota/QuotaExceededDialog";
import UnifiedAIChat from "@/components/ai-chat/UnifiedAIChat";

export default function AskAIPage() {
  const { documents, refreshDocuments } = useDocuments();
  const {
    planName,
    remainingUsage,
    isUnlimited,
    loading: aiUsageLoading,
  } = useAiUsage();
  const { refreshDocumentQuota } = useDocumentQuota();
  const [isUploading, setIsUploading] = useState(false);
  const [quotaDialog, setQuotaDialog] = useState({
    open: false,
    type: "AI",
    message: "",
  });

  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading & parsing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("visibility", "PUBLIC");

      await axiosClient.post("/api/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(`Uploaded ${file.name} successfully!`, { id: toastId });
      await refreshDocumentQuota();
      await refreshDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      if (isDocumentQuotaExceeded(error)) {
        toast.dismiss(toastId);
        const message = error.response?.data?.message;
        setQuotaDialog({
          open: true,
          type: message?.toLowerCase().includes("file size")
            ? "FILE_SIZE"
            : "DOCUMENT",
          message,
        });
        await refreshDocumentQuota();
        return;
      }
      toast.error("Failed to upload document", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="h-[calc(100vh-73px)] flex overflow-hidden bg-[#fafafa] rounded-b-xl -mx-8 -my-6">
      <UnifiedAIChat
        mode="PERSONAL"
        documents={documents}
        onRefreshDocuments={refreshDocuments}
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
