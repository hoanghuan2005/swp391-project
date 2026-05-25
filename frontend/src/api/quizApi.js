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
