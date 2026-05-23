import axiosClient from "./axiosClient";

export const askAi = async (request) => {
  const response = await axiosClient.post("/api/ai/ask", request);
  return response.data;
};
