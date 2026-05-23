package com.example.keeper.systems.ai_ask.service;

import com.example.keeper.systems.ai_ask.dto.request.AskAIRequest;
import com.example.keeper.systems.ai_ask.dto.response.AskAIResponse;

public interface AiAskService {

    AskAIResponse ask(AskAIRequest request);
}