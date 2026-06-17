import { useCallback, useEffect, useState } from "react";
import { getMyDocumentQuota } from "@/api/documentQuotaApi";

const DEFAULT_QUOTA = {
  subscriptionTier: "FREE",
  uploadsToday: null,
  dailyUploadLimit: null,
  totalDocuments: null,
  totalDocumentLimit: null,
  maxFileSizeBytes: null,
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

    return () => {
      active = false;
    };
  }, []);

  return {
    ...documentQuota,
    loading,
    refreshDocumentQuota,
  };
}
