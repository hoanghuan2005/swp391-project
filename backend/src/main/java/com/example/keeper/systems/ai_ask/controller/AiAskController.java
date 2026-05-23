package com.example.keeper.systems.ai_ask.controller;

import com.example.keeper.systems.ai_ask.dto.request.AskAIRequest;
import com.example.keeper.systems.ai_ask.dto.request.CreateConversationRequest;
import com.example.keeper.systems.ai_ask.dto.response.AskAIResponse;
import com.example.keeper.systems.ai_ask.entity.AiConversation;
import com.example.keeper.systems.ai_ask.entity.AiMessage;
import com.example.keeper.systems.ai_ask.service.AiAskService;
import com.example.keeper.systems.ai_ask.service.ConversationService;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAskController {

    private final AiAskService aiAskService;
    private final ConversationService conversationService;
    private final UserRepository userRepository;

    @PostMapping("/ask")
    public ResponseEntity<AskAIResponse> ask(
            @RequestBody @Valid AskAIRequest request
    ) {
        AskAIResponse response = aiAskService.ask(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<AiConversation>> getConversations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<AiConversation> conversations = conversationService.getUserConversations(user.getId());
        return ResponseEntity.ok(conversations);
    }

    @PostMapping("/conversations")
    public ResponseEntity<AiConversation> createConversation(
            @RequestBody(required = false) CreateConversationRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String title = (request != null && request.getTitle() != null) ? request.getTitle() : "New Chat";
        UUID documentId = (request != null) ? request.getDocumentId() : null;
        AiConversation conversation = conversationService.createConversation(user.getId(), title, documentId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<AiMessage>> getMessages(
            @PathVariable UUID id
    ) {
        List<AiMessage> messages = conversationService.getConversationMessages(id);
        return ResponseEntity.ok(messages);
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable UUID id
    ) {
        conversationService.deleteConversation(id);
        return ResponseEntity.ok().build();
    }
}
