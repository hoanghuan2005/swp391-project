import axiosClient from "./axiosClient";

export const askAi = async (request) => {
  const response = await axiosClient.post("/api/ai/ask", request);
  return response.data;
};

export const createAiConversation = async (request) => {
  const response = await axiosClient.post("/api/ai/conversations", request);
  return response.data;
};

export const getAiConversations = async (params) => {
  const response = await axiosClient.get("/api/ai/conversations", { params });
  return response.data;
};

export const getAiConversationMessages = async (conversationId) => {
  const response = await axiosClient.get(
    `/api/ai/conversations/${conversationId}/messages`,
  );
  return response.data;
};

export const deleteAiConversation = async (conversationId) => {
  await axiosClient.delete(`/api/ai/conversations/${conversationId}`);
};

export const askSharedAi = async (request) => {
  const response = await axiosClient.post("/api/ai/shared/ask", request);
  return response.data;
};
