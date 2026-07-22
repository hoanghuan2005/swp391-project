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

// ==========================================
// ADDED FOR DOCUMENT REVIEWS FEATURE
// ==========================================

export const getDocumentReviews = async (documentId) => {
  const response = await axiosClient.get(`/api/documents/${documentId}/reviews`);
  return response;
};

export const submitDocumentReview = async (documentId, data) => {
  const response = await axiosClient.post(`/api/documents/${documentId}/reviews`, data);
  return response;
};

export const reportDocument = async (documentId, reason) => {
  return await axiosClient.post(`/api/documents/${documentId}/report`, { reason });
};

export const getDocumentReports = async () => {
  return await axiosClient.get("/api/admin/documents/reports");
};

export const resolveDocumentReport = async (reportId, status) => {
  return await axiosClient.put(`/api/admin/documents/reports/${reportId}/resolve`, null, {
    params: { status },
  });
};

// ==========================================
// FEATURE: DOCUMENT VERSIONING
// ==========================================

export const uploadNewVersion = async (documentId, formData) => {
  const response = await axiosClient.post(
    `/api/documents/${documentId}/versions`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const getDocumentVersions = async (documentId) => {
  const response = await axiosClient.get(`/api/documents/${documentId}/versions`);
  return response.data;
};

export const downloadDocumentVersion = async (documentId, versionId) => {
  const response = await axiosClient.get(
    `/api/documents/${documentId}/versions/${versionId}/download`
  );
  return response.data;
};