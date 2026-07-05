package com.example.keeper.systems.ai_flashcard.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class FlashcardResponse {
    private UUID id;
    private String term;
    private String definition;
}
