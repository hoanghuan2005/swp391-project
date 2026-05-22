package com.example.keeper.systems.ai_ask.service;

import java.util.UUID;

public interface AiAskService {
    String ask(UUID userId, UUID documentId, String question);
}
