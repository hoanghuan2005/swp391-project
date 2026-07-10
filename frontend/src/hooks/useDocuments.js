// hooks/useDocuments.js

import { useEffect, useState, useCallback } from "react";
import { fetchUploadedDocuments } from "@/api/documentApi";

export default function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchUploadedDocuments();

      setDocuments(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocuments();
  }, [fetchDocuments]);

  // Listen for global upload events so lists refresh automatically after upload
  useEffect(() => {
    const onUploaded = () => {
      fetchDocuments();
    };

    window.addEventListener("documents:uploaded", onUploaded);

    return () => window.removeEventListener("documents:uploaded", onUploaded);
  }, [fetchDocuments]);

  return {
    documents,
    setDocuments,
    loading,
    refreshDocuments: fetchDocuments,
  };
}
