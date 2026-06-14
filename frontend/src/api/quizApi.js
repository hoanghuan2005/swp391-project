import axiosClient from "./axiosClient";

export const generateQuiz = async (request) => {
  const response = await axiosClient.post("/api/quizzes/generate", request);
  return response.data;
};

export const getQuizById = async (id) => {
  const response = await axiosClient.get(`/api/quizzes/${id}`);
  return response.data;
};

export const getUserQuizzes = async () => {
  const response = await axiosClient.get("/api/quizzes/my-quizzes");
  return response.data;
};

export const updateQuiz = async (id, request) => {
  const response = await axiosClient.put(`/api/quizzes/${id}`, request);
  return response.data;
};

export const deleteQuiz = async (id) => {
  await axiosClient.delete(`/api/quizzes/${id}`);
};

export const getCourseQuizzes = async (courseId) => {
  const response = await axiosClient.get(`/api/quizzes/course/${courseId}`);
  return response.data;
};
