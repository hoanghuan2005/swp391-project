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

export const updateProjectVisibility = async (projectId, visibility) => {
  const response = await axiosClient.put(`/api/projects/${projectId}/visibility`, null, {
    params: { visibility }
  });
  return response.data;
};

export const updateProjectInfo = async (projectId, name, description) => {
  const response = await axiosClient.put(`/api/projects/${projectId}/info`, null, {
    params: { name, description }
  });
  return response.data;
};

export const inviteMember = async (projectId, email, role) => {
  const response = await axiosClient.post(`/api/projects/${projectId}/invitations`, null, {
    params: { email, role }
  });
  return response.data;
};

export const verifyInvitationToken = async (token) => {
  const response = await axiosClient.get(`/api/projects/invitations/${token}`);
  return response.data;
};

export const acceptInvitation = async (token) => {
  const response = await axiosClient.post(`/api/projects/invitations/${token}/accept`);
  return response.data;
};

export const rejectInvitation = async (token) => {
  const response = await axiosClient.post(`/api/projects/invitations/${token}/reject`);
  return response.data;
};

export const changeMemberRole = async (projectId, userId, role) => {
  const response = await axiosClient.put(`/api/projects/${projectId}/members/${userId}`, null, {
    params: { role }
  });
  return response.data;
};

export const removeMember = async (projectId, userId) => {
  const response = await axiosClient.delete(`/api/projects/${projectId}/members/${userId}`);
  return response.data;
};

