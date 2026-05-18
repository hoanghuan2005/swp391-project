import React from "react";
import { useParams } from "react-router-dom";
import DocumentDetailView from "@/components/documents/DocumentDetailView";

export default function DocumentDetailPage() {
  const { id } = useParams();
  return (
    <DocumentDetailView
      documentId={id}
      fetchUrl={`/api/admin/documents/${id}`}
      backTo="/admin/documents"
      backLabel="Back to list"
    />
  );
}
