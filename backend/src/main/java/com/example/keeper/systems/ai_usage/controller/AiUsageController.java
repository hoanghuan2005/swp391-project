package com.example.keeper.systems.ai_usage.controller;

import com.example.keeper.systems.ai_usage.service.AiUsageService;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai-usage")
@RequiredArgsConstructor
public class AiUsageController {
    private final AiUsageService aiUsageService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyUsage(){
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user =  userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "subscriptionTier", user.getSubscriptionTier().name(),
                "remainingUsage", aiUsageService.getRemainingUsage(email)
                ));
    }
}
