import axiosClient from "./axiosClient";

export const createProject = async (request) => {
  const response = await axiosClient.post("/api/projects", request);
  return response.data;
};

export const getMyProjects = async () => {
  const response = await axiosClient.get("/api/projects/my-projects");
  return response.data;
};

export const getSharedProject = async (token) => {
  const response = await axiosClient.get(`/api/projects/shared/${token}`);
  return response.data;
};

export const addDocumentToProject = async (projectId, documentId) => {
  const response = await axiosClient.post(`/api/projects/${projectId}/documents/${documentId}`, {});
  return response.data;
};

export const removeDocumentFromProject = async (projectId, documentId) => {
  const response = await axiosClient.delete(`/api/projects/${projectId}/documents/${documentId}`);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await axiosClient.delete(`/api/projects/${id}`);
  return response.data;
};

export const getProjectDetail = async (id) => {
  const response = await axiosClient.get(`/api/projects/${id}`);
  return response.data;
};
