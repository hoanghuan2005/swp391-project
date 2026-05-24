package com.example.keeper.systems.ai_flashcard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardItemDto {
    private String term;
    private String definition;
}