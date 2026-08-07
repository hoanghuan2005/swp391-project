package com.example.keeper.systems.ai_quiz.service.impl;

import com.example.keeper.systems.ai_quiz.dto.request.QuizSubmitRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuizAttemptResponse;
import com.example.keeper.systems.ai_quiz.dto.response.QuizQuestionAttempt;
import com.example.keeper.systems.ai_quiz.entity.Quiz;
import com.example.keeper.systems.ai_quiz.entity.QuizAttempt;
import com.example.keeper.systems.ai_quiz.repository.QuizAttemptRepository;
import com.example.keeper.systems.ai_quiz.repository.QuizRepository;
import com.example.keeper.systems.ai_quiz.service.QuizAttemptService;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizAttemptServiceImpl implements QuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public QuizAttemptResponse submitQuiz(UUID quizId, QuizSubmitRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        List<QuizQuestionAttempt> details = new ArrayList<>();
        int score = 0;

        for (var question : quiz.getQuestions()) {
            String selectedAnswer = request.getAnswers() != null ? request.getAnswers().get(question.getId()) : null;
            boolean isCorrect = question.getCorrectAnswer().equals(selectedAnswer);
            if (isCorrect) {
                score++;
            }

            details.add(QuizQuestionAttempt.builder()
                    .questionId(question.getId())
                    .content(question.getContent())
                    .options(question.getOptions())
                    .correctAnswer(question.getCorrectAnswer())
                    .selectedAnswer(selectedAnswer)
                    .correct(isCorrect)
                    .explanation(question.getExplanation())
                    .build());
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(user)
                .score(score)
                .totalQuestions(quiz.getQuestions().size())
                .elapsedSeconds(request.getElapsedSeconds())
                .details(details)
                .build();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        return mapToResponse(savedAttempt);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptResponse> getMyAttempts(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptResponse> getQuizAttempts(UUID quizId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return quizAttemptRepository.findByQuizIdAndUserIdOrderByCreatedAtDesc(quizId, user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public QuizAttemptResponse getAttemptById(UUID attemptId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Quiz attempt not found"));

        if (!attempt.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to view this quiz attempt.");
        }

        return mapToResponse(attempt);
    }

    private QuizAttemptResponse mapToResponse(QuizAttempt attempt) {
        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .courseId(attempt.getQuiz().getCourseId())
                .score(attempt.getScore())
                .totalQuestions(attempt.getTotalQuestions())
                .elapsedSeconds(attempt.getElapsedSeconds())
                .createdAt(attempt.getCreatedAt())
                .details(attempt.getDetails())
                .build();
    }
}
