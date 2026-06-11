import axiosClient from "./axiosClient";

export const generateMindMap = async (documentId) => {
  const response = await axiosClient.post("/api/v1/mindmaps/generate", {
    documentId,
  });
  return response.data;
};

export const getMindMapByDocument = async (documentId) => {
  const response = await axiosClient.get(
    `/api/v1/mindmaps/document/${documentId}`
  );
  return response.data;
};

export const deleteMindMap = async (mindMapId) => {
  const response = await axiosClient.delete(`/api/v1/mindmaps/${mindMapId}`);
  return response.data;
};
