package com.example.keeper.systems.ai_usage.controller;

import com.example.keeper.systems.ai_usage.dto.UserAiUsageResponse;
import com.example.keeper.systems.ai_usage.service.AiUsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AiUsageController {

    private final AiUsageService aiUsageService;

    @GetMapping({"/ai-usage/me", "/user/ai-usage"})
    public ResponseEntity<UserAiUsageResponse> getMyUsage() {
        String authName = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        UserAiUsageResponse usageResponse = aiUsageService.getUserAiUsage(authName);
        return ResponseEntity.ok(usageResponse);
    }
}
