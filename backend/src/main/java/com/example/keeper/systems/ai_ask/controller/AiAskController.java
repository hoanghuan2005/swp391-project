package com.example.keeper.systems.ai_ask.controller;

import com.example.keeper.systems.ai_ask.dto.request.AskRequest;
import com.example.keeper.systems.ai_ask.dto.response.AskResponse;
import com.example.keeper.systems.ai_ask.service.AiAskService;
import com.example.keeper.systems.auth.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAskController {

    private final AiAskService aiAskService;

    @PostMapping("/ask")
    public ResponseEntity<AskResponse> ask(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid AskRequest request
    ) {

        String answer = aiAskService.ask(
                user.getId(),
                request
        );

        return ResponseEntity.ok(
                new AskResponse(answer)
        );
    }
}
