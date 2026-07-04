package com.example.keeper.systems.ai_flashcard.controller;

import com.example.keeper.systems.ai_flashcard.dto.FlashcardSetUpdateRequest;
import com.example.keeper.systems.ai_flashcard.dto.FlashcardSetResponse;
import com.example.keeper.systems.ai_flashcard.service.AiFlashcardService;
import com.example.keeper.systems.ai_quiz.dto.request.PublishMaterialRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai_flashcard")
@RequiredArgsConstructor
public class AiFlashcardController {

    private final AiFlashcardService aiFlashcardService;

    @PostMapping(value = "/generate")
    public ResponseEntity<FlashcardSetResponse> generate(
            @RequestParam(value = "document", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text
    ) throws Exception {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        FlashcardSetResponse result = aiFlashcardService.generateFlashcards(file, text, email);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/generate-from-document")
    public ResponseEntity<FlashcardSetResponse> generateFromDocument(@RequestBody Map<String, UUID> request) throws Exception {
        UUID documentId = request.get("documentId");
        if (documentId == null) {
            throw new IllegalArgumentException("documentId is required");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        FlashcardSetResponse result = aiFlashcardService.generateFlashcardsFromDocument(documentId, email);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sets")
    public ResponseEntity<List<FlashcardSetResponse>> getMyFlashcardSets() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<FlashcardSetResponse> sets = aiFlashcardService.getAllSetsByUser(email);
        return ResponseEntity.ok(sets);
    }

    @GetMapping("/sets/{id}")
    public ResponseEntity<FlashcardSetResponse> getFlashcardSetDetails(@PathVariable UUID id) {
        FlashcardSetResponse setDetails = aiFlashcardService.getSetDetailsById(id);
        return ResponseEntity.ok(setDetails);
    }

    @PutMapping("/sets/{id}")
    public ResponseEntity<FlashcardSetResponse> updateFlashcardSet(
            @PathVariable UUID id,
            @RequestBody FlashcardSetUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        FlashcardSetResponse updated = aiFlashcardService.updateFlashcardSet(id, request, email);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/my-documents")
    public ResponseEntity<List<Map<String, Object>>> getMyDocuments() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Map<String, Object>> docs = aiFlashcardService.getAllDocumentsByUser(email);
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/sets/latest")
    public ResponseEntity<Map<String, Object>> getLatestSet() {
        return ResponseEntity.ok(
                Map.of("id", UUID.randomUUID(), "title", "Latest Flashcards")
        );
    }

    @PostMapping("/sets/{id}/publish")
    public ResponseEntity<Map<String, Object>> publishSet(
            @PathVariable UUID id,
            @RequestBody PublishMaterialRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        aiFlashcardService.publishFlashcardSet(id, request.getCourseId(), request.getVisibility(), email);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<FlashcardSetResponse>> getCourseFlashcardSets(@PathVariable UUID courseId) {
        List<FlashcardSetResponse> sets = aiFlashcardService.getCourseFlashcardSets(courseId);
        return ResponseEntity.ok(sets);
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<FlashcardSetResponse>> getMyFavoriteFlashcards() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<FlashcardSetResponse> favorites = aiFlashcardService.getMyFavorites(email);
        return ResponseEntity.ok(favorites);
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<Map<String, Object>> toggleFavorite(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        aiFlashcardService.toggleFavorite(id, email);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã cập nhật trạng thái yêu thích"));
    }
}
