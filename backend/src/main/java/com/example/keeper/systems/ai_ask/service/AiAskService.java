package com.example.keeper.systems.ai_ask.service;

import com.example.keeper.systems.ai_ask.dto.request.AskRequest;
import java.util.UUID;

public interface AiAskService {
    String ask(UUID userId, AskRequest request);
}
