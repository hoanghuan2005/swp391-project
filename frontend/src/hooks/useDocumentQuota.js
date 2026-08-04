import { useCallback, useEffect, useState } from "react";
import { getMyDocumentQuota } from "@/api/documentQuotaApi";

const DEFAULT_QUOTA = {
  subscriptionTier: "FREE",
  uploadsToday: null,
  dailyUploadLimit: null,
  totalDocuments: null,
  totalDocumentLimit: null,
  maxFileSizeBytes: null,
  usedStorageBytes: 0,
  maxStorageBytes: null,
};

export default function useDocumentQuota() {
  const [documentQuota, setDocumentQuota] = useState(DEFAULT_QUOTA);
  const [loading, setLoading] = useState(true);

  const refreshDocumentQuota = useCallback(async () => {
    try {
      setLoading(true);
      const quota = await getMyDocumentQuota();
      setDocumentQuota(quota);
      return quota;
    } catch (error) {
      console.error("Failed to load document quota:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const fetchQuota = () => {
      getMyDocumentQuota()
        .then((quota) => {
          if (active) {
            setDocumentQuota(quota);
          }
        })
        .catch((error) => {
          console.error("Failed to load document quota:", error);
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    };

    fetchQuota();

    const handleUpdate = () => {
      fetchQuota();
    };

    window.addEventListener("subscription-success", handleUpdate);
    window.addEventListener("subscription:updated", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("subscription-success", handleUpdate);
      window.removeEventListener("subscription:updated", handleUpdate);
    };
  }, []);

  return {
    ...documentQuota,
    loading,
    refreshDocumentQuota,
  };
}
