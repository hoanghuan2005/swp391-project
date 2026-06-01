package com.example.keeper.systems.ai_ask.dto.request;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder

@NoArgsConstructor
@AllArgsConstructor
public class AskAIRequest {

    private UUID conversationId;

    private String message;

    private UUID projectId;

    private UUID documentId;

    // for multi-select
    private List<UUID> documentIds;
}