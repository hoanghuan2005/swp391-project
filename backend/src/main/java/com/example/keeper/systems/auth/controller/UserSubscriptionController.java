package com.example.keeper.systems.auth.controller;

import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.SubscriptionPlanRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.notification.service.NotificationService;
import com.example.keeper.systems.notification.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class UserSubscriptionController {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final NotificationService notificationService;

    @GetMapping("/plans")
    public ResponseEntity<java.util.List<SubscriptionPlan>> getActivePlans() {
        return ResponseEntity.ok(subscriptionPlanRepository.findByIsActiveTrueOrderByPriceVndAsc());
    }

    @GetMapping("/my-subscription")
    public ResponseEntity<?> getMySubscription(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthenticated"));
        }

        String authName = authentication.getName();
        User user = userRepository.findByEmail(authName)
                .orElseGet(() -> userRepository.findByUsername(authName)
                        .orElseThrow(() -> new RuntimeException("User not found")));

        String tierCode = user.getSubscriptionTier() != null ? user.getSubscriptionTier() : "FREE";

        SubscriptionPlan plan = subscriptionPlanRepository.findByCodeAndIsActiveTrue(tierCode)
                .orElseGet(() -> subscriptionPlanRepository.findByCode("FREE")
                        .orElse(null));

        long userTotalStorage = user.getMaxStorageBytes() != null
                ? user.getMaxStorageBytes()
                : (plan != null ? plan.getTotalStorageBytes() : 100 * 1024 * 1024L);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("username", user.getUsername());
        result.put("subscriptionTier", tierCode);
        result.put("planName", plan != null ? plan.getName() : "Gói Miễn Phí");
        result.put("priceVnd", plan != null ? plan.getPriceVnd() : 0);
        result.put("maxFileSizeBytes", plan != null ? plan.getMaxFileSizeBytes() : 5 * 1024 * 1024);
        result.put("totalStorageBytes", userTotalStorage);
        result.put("dailyUploadLimit", plan != null ? plan.getDailyUploadLimit() : 3);
        result.put("totalDocumentLimit", plan != null ? plan.getTotalDocumentLimit() : 20);
        result.put("dailyAiLimit", plan != null && plan.getDailyAiLimit() != null ? plan.getDailyAiLimit() : 5);
        result.put("maxFlashcardsPerGeneration", plan != null && plan.getMaxFlashcardsPerGeneration() != null ? plan.getMaxFlashcardsPerGeneration() : 15);
        result.put("maxQuizQuestionsPerGeneration", plan != null && plan.getMaxQuizQuestionsPerGeneration() != null ? plan.getMaxQuizQuestionsPerGeneration() : 20);
        result.put("maxOwnedProjects", plan != null && plan.getMaxOwnedProjects() != null ? plan.getMaxOwnedProjects() : 3);
        result.put("maxJoinedProjects", plan != null && plan.getMaxJoinedProjects() != null ? plan.getMaxJoinedProjects() : 5);
        result.put("maxAiContextChunks", plan != null && plan.getMaxAiContextChunks() != null ? plan.getMaxAiContextChunks() : 4);
        result.put("maxChunkChars", plan != null && plan.getMaxChunkChars() != null ? plan.getMaxChunkChars() : 400);
        result.put("canCancel", plan != null && plan.getPriceVnd() != null && plan.getPriceVnd() > 0);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthenticated"));
        }

        String authName = authentication.getName();
        User user = userRepository.findByEmail(authName)
                .orElseGet(() -> userRepository.findByUsername(authName)
                        .orElseThrow(() -> new RuntimeException("User not found")));

        if ("FREE".equalsIgnoreCase(user.getSubscriptionTier())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tài khoản của bạn hiện đã là gói Miễn Phí (FREE)."));
        }

        // Downgrade user to FREE tier & snapshot FREE plan storage limit
        user.setSubscriptionTier("FREE");
        SubscriptionPlan freePlan = subscriptionPlanRepository.findByCodeAndIsActiveTrue("FREE")
                .orElseGet(() -> subscriptionPlanRepository.findTopByPriceVndAndIsActiveTrueOrderByCreatedAtAsc(0L)
                        .orElseGet(() -> subscriptionPlanRepository.findByCode("FREE").orElse(null)));
        if (freePlan != null && freePlan.getTotalStorageBytes() != null) {
            user.setMaxStorageBytes(freePlan.getTotalStorageBytes());
        }
        userRepository.save(user);

        // Send notification
        try {
            notificationService.createNotification(
                    user,
                    null,
                    NotificationType.PRO_CANCELLED,
                    "PRO Subscription Cancelled",
                    "Your PRO subscription has been cancelled. Your account has reverted to the Free tier.",
                    null,
                    null
            );
        } catch (Exception e) {
            System.err.println("Failed to send cancellation notification: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Hủy gói PRO thành công. Tài khoản đã chuyển về gói Miễn Phí (FREE).",
                "subscriptionTier", "FREE"
        ));
    }
}
