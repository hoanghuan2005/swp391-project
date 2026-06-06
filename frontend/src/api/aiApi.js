import axiosClient from "./axiosClient";

export const askAi = async (request) => {
  const response = await axiosClient.post("/api/ai/ask", request);
  return response.data;
};

export const createAiConversation = async (request) => {
  const response = await axiosClient.post("/api/ai/conversations", request);
  return response.data;
};

export const askSharedAi = async (request) => {
  const response = await axiosClient.post("/api/ai/shared/ask", request);
  return response.data;
};
