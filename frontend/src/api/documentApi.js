import axiosClient from "./axiosClient";

export const getRecentDocuments = async (limit = 10) => {
  const response = await axiosClient.get("/api/documents/recent", {
    params: { limit },
  });
  return response.data;
};

export const recordDocumentView = async (documentId) => {
  await axiosClient.post(`/api/documents/${documentId}/view`);
};

export const fetchUploadedDocuments = async () => {
  const response = await axiosClient.get("/api/documents/my-uploads");
  return response.data;
};
