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
import com.example.keeper.systems.ai_usage.exception.AiQuotaExceededException;



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
        } catch (AiQuotaExceededException e) {
            throw e;
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
        } catch (AiQuotaExceededException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", e.getMessage())
            );
        }
    }


    @GetMapping("/sets")
    public ResponseEntity<?> getMyFlashcardSets(
            @RequestParam(value = "savedToLibrary", required = false) Boolean savedToLibrary) {
        var sets = aiFlashcardService.getAllSetsByUser(savedToLibrary);
        return ResponseEntity.ok(Map.of("data", sets));
    }



    @GetMapping("/sets/{id}")

    public ResponseEntity<?> getFlashcardSetDetails(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var setDetails = aiFlashcardService.getSetDetailsById(id, email);

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

    @DeleteMapping("/sets/{id}")
    public ResponseEntity<?> deleteFlashcardSet(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            aiFlashcardService.deleteFlashcardSet(id, email);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/sets/{id}/rename")
    public ResponseEntity<?> renameFlashcardSet(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            String title = request.get("title");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", aiFlashcardService.renameFlashcardSet(id, title, email)
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

    // ====================================================================
    // API LẤY DANH SÁCH FLASHCARD ĐÃ THÍCH
    // ====================================================================
    @GetMapping("/favorites")
    public ResponseEntity<?> getMyFavoriteFlashcards() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        // Trả về trực tiếp list để Frontend dễ map
        return ResponseEntity.ok(aiFlashcardService.getMyFavorites(email));
    }

    // ====================================================================
    // API THẢ TIM / BỎ TIM FLASHCARD
    // ====================================================================
    @PostMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        aiFlashcardService.toggleFavorite(id, email);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã cập nhật trạng thái yêu thích"));
    }
    
}
