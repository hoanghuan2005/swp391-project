package com.example.keeper.systems.ai_usage.controller;

import com.example.keeper.systems.ai_usage.dto.UserAiUsageResponse;
import com.example.keeper.systems.ai_usage.service.AiUsageService;
import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.SubscriptionPlanRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AiUsageController {

    private final AiUsageService aiUsageService;
    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @GetMapping({"/ai-usage/me", "/user/ai-usage"})
    public ResponseEntity<Map<String, Object>> getMyUsage() {
        String authName = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(authName)
                .orElseGet(() -> userRepository.findByUsername(authName)
                        .orElseThrow(() -> new RuntimeException("User not found")));

        String tierCode = user.getSubscriptionTier() != null ? user.getSubscriptionTier() : "FREE";

        SubscriptionPlan plan = subscriptionPlanRepository.findByCodeAndIsActiveTrue(tierCode)
                .orElseGet(() -> subscriptionPlanRepository.findByCode(tierCode).orElse(null));

        // 1. Tên Plan động từ DB
        String planName = (plan != null && plan.getName() != null) ? plan.getName() : tierCode;

        // 2. Lấy giới hạn từ DB (Dùng null-safe getter)
        Map<String, Object> tierLimits = new LinkedHashMap<>();
        tierLimits.put("dailyAiLimit", plan != null ? plan.getDailyAiLimit() : 10);
        tierLimits.put("maxFlashcardsPerGeneration", plan != null ? plan.getMaxFlashcardsPerGeneration() : 15);
        tierLimits.put("maxQuizQuestionsPerGeneration", plan != null ? plan.getMaxQuizQuestionsPerGeneration() : 20);
        tierLimits.put("maxOwnedProjects", plan != null ? plan.getMaxOwnedProjects() : 3);
        tierLimits.put("maxJoinedProjects", plan != null ? plan.getMaxJoinedProjects() : 5);
        long userTotalStorage = user.getMaxStorageBytes() != null
                ? user.getMaxStorageBytes()
                : (plan != null && plan.getTotalStorageBytes() != null ? plan.getTotalStorageBytes() : 100 * 1024 * 1024L);
        tierLimits.put("totalStorageBytes", userTotalStorage);
        tierLimits.put("maxFileSizeBytes", plan != null ? plan.getMaxFileSizeBytes() : 5 * 1024 * 1024L);
        tierLimits.put("dailyUploadLimit", plan != null ? plan.getDailyUploadLimit() : 3L);
        tierLimits.put("totalDocumentLimit", plan != null ? plan.getTotalDocumentLimit() : 20L);

        int maxSelectedDocs = (plan != null && plan.getMaxSelectedDocs() != null) ? plan.getMaxSelectedDocs() : 2;
        tierLimits.put("maxSelectedDocs", maxSelectedDocs);

        long remainingUsage = aiUsageService.getRemainingUsage(user.getEmail());
        boolean isUnlimited = (plan != null && Integer.valueOf(-1).equals(plan.getDailyAiLimit())) || remainingUsage == -1;

        // 3. Response chuẩn cấu trúc cho Frontend Hook
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("subscriptionTier", tierCode);
        response.put("planName", planName);
        response.put("remainingUsage", remainingUsage);
        response.put("isUnlimited", isUnlimited);
        response.put("maxSelectedDocs", maxSelectedDocs);
        response.put("tierLimits", tierLimits);

        return ResponseEntity.ok(response);
    }
}
