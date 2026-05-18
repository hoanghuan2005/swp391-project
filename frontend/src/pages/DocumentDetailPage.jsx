import React from "react";
import { useParams } from "react-router-dom";
import DocumentDetailView from "@/components/documents/DocumentDetailView";

export default function DocumentDetailPage() {
  const { id } = useParams();

  return (
    <DocumentDetailView
      documentId={id}
      fetchUrl={`/api/documents/${id}/detail`}
      backTo="/home"
      backLabel="Back to home"
      headerTitle="Document Detail"
      headerDescription="Explore document information and preview the file."
    />
  );
}
