package com.example.keeper.systems.ai_quiz.service;

import com.example.keeper.systems.ai_quiz.dto.request.QuizSubmitRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuizAttemptResponse;

import java.util.List;
import java.util.UUID;

public interface QuizAttemptService {
    QuizAttemptResponse submitQuiz(UUID quizId, QuizSubmitRequest request, String userEmail);
    List<QuizAttemptResponse> getMyAttempts(String userEmail);
    List<QuizAttemptResponse> getQuizAttempts(UUID quizId, String userEmail);
    QuizAttemptResponse getAttemptById(UUID attemptId, String userEmail);
}
