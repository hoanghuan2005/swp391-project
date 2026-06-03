package com.example.keeper.systems.ai_ask.dto.request;

import lombok.*;

import java.util.UUID;

@Data
@Builder

@NoArgsConstructor
@AllArgsConstructor
public class CreateConversationRequest {

    private String title;

    private UUID documentId;

    private UUID projectId;
}
