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

        User user = userRepository.findByEmail(authName)
                .orElseGet(() -> userRepository.findByUsername(authName)
                        .orElseThrow(() -> new RuntimeException("User not found")));

        SubscriptionTier tier = user.getSubscriptionTier() != null ? user.getSubscriptionTier() : SubscriptionTier.FREE;

        SubscriptionPlan plan = subscriptionPlanRepository.findByCodeAndIsActiveTrue(tier.name())
                .orElseGet(() -> subscriptionPlanRepository.findByCode(tier.name()).orElse(null));

        boolean isPro = tier == SubscriptionTier.PRO;
        Map<String, Object> tierLimits = new LinkedHashMap<>();
        tierLimits.put("maxFlashcardsPerGeneration", plan != null && plan.getMaxFlashcardsPerGeneration() != null ? plan.getMaxFlashcardsPerGeneration() : (isPro ? -1 : 15));
        tierLimits.put("maxQuizQuestionsPerGeneration", plan != null && plan.getMaxQuizQuestionsPerGeneration() != null ? plan.getMaxQuizQuestionsPerGeneration() : (isPro ? 50 : 20));
        tierLimits.put("maxOwnedProjects", plan != null && plan.getMaxOwnedProjects() != null ? plan.getMaxOwnedProjects() : (isPro ? -1 : 3));
        tierLimits.put("maxJoinedProjects", plan != null && plan.getMaxJoinedProjects() != null ? plan.getMaxJoinedProjects() : (isPro ? -1 : 5));
        tierLimits.put("maxFileSizeBytes", plan != null && plan.getMaxFileSizeBytes() != null ? plan.getMaxFileSizeBytes() : (isPro ? 10 * 1024 * 1024L : 5 * 1024 * 1024L));
        tierLimits.put("dailyUploadLimit", plan != null && plan.getDailyUploadLimit() != null ? plan.getDailyUploadLimit() : (isPro ? -1L : 3L));
        tierLimits.put("totalDocumentLimit", plan != null && plan.getTotalDocumentLimit() != null ? plan.getTotalDocumentLimit() : (isPro ? -1L : 20L));
        int maxSelectedDocs = plan != null && plan.getMaxSelectedDocs() != null ? plan.getMaxSelectedDocs() : (isPro ? 4 : 2);
        tierLimits.put("maxSelectedDocs", maxSelectedDocs);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("subscriptionTier", tier.name());
        response.put("remainingUsage", aiUsageService.getRemainingUsage(user.getEmail()));
        response.put("maxSelectedDocs", maxSelectedDocs);
        response.put("tierLimits", tierLimits);

        return ResponseEntity.ok(response);
    }
}
