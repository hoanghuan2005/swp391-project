package com.example.keeper.systems.ai_ask.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder

@NoArgsConstructor
@AllArgsConstructor
public class AskAIResponse {

    private UUID conversationId;

    private UUID assistantMessageId;

    private String answer;
}