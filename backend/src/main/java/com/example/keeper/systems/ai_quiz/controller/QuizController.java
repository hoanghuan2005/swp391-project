package com.example.keeper.systems.ai_quiz.controller;

import com.example.keeper.systems.ai_quiz.dto.request.QuizRequest;
import com.example.keeper.systems.ai_quiz.dto.request.QuizUpdateRequest;
import com.example.keeper.systems.ai_quiz.dto.request.QuizSubmitRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuizResponse;
import com.example.keeper.systems.ai_quiz.dto.response.QuizAttemptResponse;
import com.example.keeper.systems.ai_quiz.service.QuizGeneratorService;
import com.example.keeper.systems.ai_quiz.service.QuizService;
import com.example.keeper.systems.ai_quiz.service.QuizAttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizGeneratorService quizGeneratorService;
    private final QuizService quizService;
    private final QuizAttemptService quizAttemptService;

    @PostMapping("/generate")
    public ResponseEntity<QuizResponse> generateQuiz(@RequestBody @Valid QuizRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizGeneratorService.generateQuiz(request, email));
    }

    @PostMapping(value = "/generate-from-file", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuizResponse> generateQuizFromFile(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam("title") String title,
            @RequestParam(value = "questionCount", required = false) Integer questionCount,
            @RequestParam(value = "difficulty", required = false) String difficulty
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizGeneratorService.generateQuizFromFile(file, text, title, questionCount, difficulty, email));
    }

    @GetMapping("/my-quizzes")
    public ResponseEntity<List<QuizResponse>> getUserQuizzes(
            @RequestParam(value = "savedToLibrary", required = false) Boolean savedToLibrary) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizService.getUserQuizzes(email, savedToLibrary));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizResponse> getQuizById(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizService.getQuizById(id, email));
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

    @PutMapping("/{id}/rename")
    public ResponseEntity<?> renameQuiz(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            String title = request.get("title");
            return ResponseEntity.ok(quizService.renameQuiz(id, title, email));
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
        List<UUID> courseIds = request.getCourseIds();
        if (courseIds == null || courseIds.isEmpty()) {
            if (request.getCourseId() != null) {
                courseIds = java.util.Collections.singletonList(request.getCourseId());
            } else {
                courseIds = java.util.Collections.emptyList();
            }
        }
        quizService.publishQuiz(id, courseIds, request.getVisibility(), email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<QuizResponse>> getCourseQuizzes(@PathVariable UUID courseId) {
        return ResponseEntity.ok(quizService.getCourseQuizzes(courseId));
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<QuizResponse>> getMyFavoriteQuizzes() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizService.getMyFavorites(email));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<java.util.Map<String, Object>> toggleFavorite(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        quizService.toggleFavorite(id, email);
        return ResponseEntity.ok(java.util.Map.of("message", "Favorite status updated"));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<QuizAttemptResponse> submitQuiz(
            @PathVariable UUID id,
            @RequestBody @Valid QuizSubmitRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizAttemptService.submitQuiz(id, request, email));
    }

    @GetMapping("/attempts/my")
    public ResponseEntity<List<QuizAttemptResponse>> getMyAttempts() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizAttemptService.getMyAttempts(email));
    }

    @GetMapping("/{id}/attempts")
    public ResponseEntity<List<QuizAttemptResponse>> getQuizAttempts(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizAttemptService.getQuizAttempts(id, email));
    }

    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<QuizAttemptResponse> getAttemptById(@PathVariable UUID attemptId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(quizAttemptService.getAttemptById(attemptId, email));
    }
}
