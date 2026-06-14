import axiosClient from "./axiosClient";

export const getMyDocumentQuota = async () => {
  const response = await axiosClient.get("/api/document-quota/me");
  return response.data;
};

export const isDocumentQuotaExceeded = (error) =>
  error.response?.status === 429 &&
  error.response?.data?.code === "DOCUMENT_QUOTA_EXCEEDED";
