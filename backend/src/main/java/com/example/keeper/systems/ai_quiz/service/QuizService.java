package com.example.keeper.systems.ai_quiz.service;

import com.example.keeper.systems.ai_quiz.dto.request.QuizRequest;
import com.example.keeper.systems.ai_quiz.dto.request.QuizUpdateRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuizResponse;

import java.util.List;
import java.util.UUID;

public interface QuizService {
    QuizResponse createQuiz(QuizRequest request, String userEmail);
    QuizResponse getQuizById(UUID id);
    QuizResponse updateQuiz(UUID id, QuizUpdateRequest request, String userEmail);
    List<QuizResponse> getUserQuizzes(String userEmail);
    void deleteQuiz(UUID id, String userEmail);
    void publishQuiz(UUID id, UUID courseId, String visibility, String userEmail);
    List<QuizResponse> getCourseQuizzes(UUID courseId);
}
