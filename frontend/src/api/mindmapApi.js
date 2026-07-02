import axiosClient from "./axiosClient";

export const generateMindMap = async (documentId) => {
  const response = await axiosClient.post("/api/v1/mindmaps/generate", {
    documentId,
  });
  return response.data;
};

export const generateMindMapFromFile = async (formData) => {
  const response = await axiosClient.post("/api/v1/mindmaps/generate-from-file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
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

export const getUserMindMaps = async () => {
  const response = await axiosClient.get("/api/v1/mindmaps");
  return response.data;
};

export const renameMindMap = async (id, title) => {
  const response = await axiosClient.put(`/api/v1/mindmaps/${id}/rename`, { title });
  return response.data;
};
