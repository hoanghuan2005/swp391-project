package com.example.keeper.systems.ai_flashcard.controller;

import com.example.keeper.systems.ai_flashcard.dto.FlashcardGenerateRequest;
import com.example.keeper.systems.ai_flashcard.dto.FlashcardItemDto;
import com.example.keeper.systems.ai_flashcard.service.AiFlashcardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/flashcards")
@CrossOrigin(origins = "http://localhost:5173") // Thêm dòng này để fix lỗi CORS
// Nhớ config CORS nếu cần thiết
public class AiFlashcardController {

    private final AiFlashcardService aiFlashcardService;

    public AiFlashcardController(AiFlashcardService aiFlashcardService) {
        this.aiFlashcardService = aiFlashcardService;
    }

    @PostMapping("/generate")
    public ResponseEntity<List<FlashcardItemDto>> generate(@RequestBody FlashcardGenerateRequest request) {
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<FlashcardItemDto> result = aiFlashcardService.generateFlashcards(request.getContent());
        return ResponseEntity.ok(result);
    }
}