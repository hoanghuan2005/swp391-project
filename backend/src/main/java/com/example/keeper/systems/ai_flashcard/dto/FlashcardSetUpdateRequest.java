package com.example.keeper.systems.ai_flashcard.dto;

import lombok.Data;

import java.util.List;

@Data
public class FlashcardSetUpdateRequest {
    private String title;
    private List<FlashcardItemDto> flashcards;
}
