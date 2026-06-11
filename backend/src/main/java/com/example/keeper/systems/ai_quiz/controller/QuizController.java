package com.example.keeper.systems.ai_quiz.controller;

import com.example.keeper.systems.ai_quiz.dto.request.QuizRequest;
import com.example.keeper.systems.ai_quiz.dto.request.QuizUpdateRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuizResponse;
import com.example.keeper.systems.ai_quiz.service.QuizGeneratorService;
import com.example.keeper.systems.ai_quiz.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizGeneratorService quizGeneratorService;
    private final QuizService quizService;

    @PostMapping("/generate")
    public ResponseEntity<QuizResponse> generateQuiz(@RequestBody @Valid QuizRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizGeneratorService.generateQuiz(request, email));
    }

    @GetMapping("/my-quizzes")
    public ResponseEntity<List<QuizResponse>> getUserQuizzes() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizService.getUserQuizzes(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizResponse> getQuizById(@PathVariable UUID id) {
        return ResponseEntity.ok(quizService.getQuizById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuiz(
            @PathVariable UUID id,
            @RequestBody QuizUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return ResponseEntity.ok(quizService.updateQuiz(id, request, email));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        quizService.deleteQuiz(id, email);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<Void> publishQuiz(
            @PathVariable UUID id,
            @RequestBody com.example.keeper.systems.ai_quiz.dto.request.PublishMaterialRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        quizService.publishQuiz(id, request.getCourseId(), request.getVisibility(), email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<QuizResponse>> getCourseQuizzes(@PathVariable UUID courseId) {
        return ResponseEntity.ok(quizService.getCourseQuizzes(courseId));
    }
}
