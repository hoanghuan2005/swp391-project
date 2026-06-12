import axiosClient from "./axiosClient";

export const getFlashcardSets = async () => {
  const response = await axiosClient.get("/api/ai_flashcard/sets");
  return response.data;
};

export const getFlashcardSet = async (setId) => {
  const response = await axiosClient.get(`/api/ai_flashcard/sets/${setId}`);
  return response.data;
};

export const updateFlashcardSet = async (setId, request) => {
  const response = await axiosClient.put(
    `/api/ai_flashcard/sets/${setId}`,
    request,
  );
  return response.data;
};

export const generateFlashcards = async (formData) => {
  const response = await axiosClient.post("/api/ai_flashcard/generate", formData);
  return response.data;
};

export const generateFlashcardsFromDocument = async (documentId) => {
  const response = await axiosClient.post(
    "/api/ai_flashcard/generate-from-document",
    { documentId },
  );
  return response.data;
};

export const getCourseFlashcardSets = async (courseId) => {
  const response = await axiosClient.get(`/api/ai_flashcard/course/${courseId}`);
  return response.data;
};
