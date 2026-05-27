package com.example.keeper.systems.ai_flashcard.controller;

import com.example.keeper.systems.ai_flashcard.service.AiFlashcardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/flashcards")
public class AiFlashcardController {

    @Autowired
    private AiFlashcardService aiFlashcardService;

    @PostMapping("/generate")
    public ResponseEntity<?> generate(
            @RequestParam(value = "document", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text) {
        try {
            // Service sẽ tự nhận biết và trích xuất text từ file hoặc dùng text truyền vào
            var result = aiFlashcardService.generateFlashcards(file, text);
            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}