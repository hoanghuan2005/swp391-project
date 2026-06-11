package com.example.keeper.systems.ai_flashcard.controller;



import com.example.keeper.systems.ai_flashcard.dto.FlashcardSetUpdateRequest;
import com.example.keeper.systems.ai_flashcard.service.AiFlashcardService;

import com.example.keeper.systems.ai_quiz.dto.request.PublishMaterialRequest;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.ResponseEntity;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;



import java.util.Map;

import java.util.UUID;



@RestController

@RequestMapping("/api/ai_flashcard")

public class AiFlashcardController {



    @Autowired

    private AiFlashcardService aiFlashcardService;



    @PostMapping(value = "/generate") // Bỏ luôn consumes đi cho dễ chịu
    public ResponseEntity<?> generate(
            @RequestParam(value = "document", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text
    ) {
        // --- IN RA ĐỂ KIỂM TRA ---
        System.out.println("=== DỮ LIỆU REACT GỬI LÊN ===");
        System.out.println("Nội dung Text: " + text);
        System.out.println("Có file đính kèm không? " + (file != null ? "Có (" + file.getOriginalFilename() + ")" : "Không"));
        System.out.println("=============================");

        try {
            var result = aiFlashcardService.generateFlashcards(file, text);
            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", e.getMessage())
            );
        }
    }

    @PostMapping("/generate-from-document")
    public ResponseEntity<?> generateFromDocument(@RequestBody Map<String, UUID> request) {
        UUID documentId = request.get("documentId");
        if (documentId == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "documentId is required")
            );
        }

        try {
            var result = aiFlashcardService.generateFlashcardsFromDocument(documentId);
            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", e.getMessage())
            );
        }
    }


    @GetMapping("/sets")

    public ResponseEntity<?> getMyFlashcardSets() {

        var sets = aiFlashcardService.getAllSetsByUser(); // Không cần truyền UUID nữa

        return ResponseEntity.ok(Map.of("data", sets));

    }



    @GetMapping("/sets/{id}")

    public ResponseEntity<?> getFlashcardSetDetails(@PathVariable UUID id) {

        var setDetails = aiFlashcardService.getSetDetailsById(id);

        return ResponseEntity.ok(Map.of("data", setDetails));

    }

    @PutMapping("/sets/{id}")
    public ResponseEntity<?> updateFlashcardSet(
            @PathVariable UUID id,
            @RequestBody FlashcardSetUpdateRequest request) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", aiFlashcardService.updateFlashcardSet(id, request)
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }



    @GetMapping("/my-documents")

    public ResponseEntity<?> getMyDocuments() {

        var docs = aiFlashcardService.getAllDocumentsByUser(); // Không cần truyền UUID nữa

        return ResponseEntity.ok(Map.of("data", docs));

    }



    @GetMapping("/sets/latest")
    public ResponseEntity<?> getLatestSet() {
        return ResponseEntity.ok(
                Map.of("data", Map.of("id", UUID.randomUUID(), "title", "Latest Flashcards"))
        );
    }

    @PostMapping("/sets/{id}/publish")
    public ResponseEntity<?> publishSet(
            @PathVariable UUID id,
            @RequestBody PublishMaterialRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            aiFlashcardService.publishFlashcardSet(id, request.getCourseId(), request.getVisibility(), email);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getCourseFlashcardSets(@PathVariable UUID courseId) {
        return ResponseEntity.ok(Map.of("data", aiFlashcardService.getCourseFlashcardSets(courseId)));
    }
}
