import axiosClient from "./axiosClient";

export const getMyAiUsage = async () => {
  const response = await axiosClient.get("/api/ai-usage/me");
  return response.data;
};

export const isAiQuotaExceeded = (error) =>
  error.response?.status === 429 &&
  error.response?.data?.code === "AI_QUOTA_EXCEEDED";
