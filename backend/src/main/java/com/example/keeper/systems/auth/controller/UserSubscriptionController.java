package com.example.keeper.systems.auth.controller;

import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.enums.SubscriptionTier;
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
        return ResponseEntity.ok(subscriptionPlanRepository.findByIsActiveTrue());
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

        SubscriptionTier tier = user.getSubscriptionTier() != null ? user.getSubscriptionTier() : SubscriptionTier.FREE;

        SubscriptionPlan plan = subscriptionPlanRepository.findByCodeAndIsActiveTrue(tier.name())
                .orElseGet(() -> subscriptionPlanRepository.findByCode("FREE")
                        .orElse(null));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("username", user.getUsername());
        result.put("subscriptionTier", tier.name());
        result.put("planName", plan != null ? plan.getName() : (tier == SubscriptionTier.PRO ? "Gói Chuyên Nghiệp (PRO)" : "Gói Miễn Phí"));
        result.put("priceVnd", plan != null ? plan.getPriceVnd() : (tier == SubscriptionTier.PRO ? 99000 : 0));
        result.put("maxFileSizeBytes", plan != null ? plan.getMaxFileSizeBytes() : (tier == SubscriptionTier.PRO ? 10 * 1024 * 1024 : 5 * 1024 * 1024));
        result.put("totalStorageBytes", plan != null ? plan.getTotalStorageBytes() : (tier == SubscriptionTier.PRO ? 1024 * 1024 * 1024 : 100 * 1024 * 1024));
        result.put("dailyUploadLimit", plan != null ? plan.getDailyUploadLimit() : (tier == SubscriptionTier.PRO ? -1 : 3));
        result.put("totalDocumentLimit", plan != null ? plan.getTotalDocumentLimit() : (tier == SubscriptionTier.PRO ? -1 : 20));
        result.put("dailyAiLimit", plan != null && plan.getDailyAiLimit() != null ? plan.getDailyAiLimit() : (tier == SubscriptionTier.PRO ? -1 : 5));
        result.put("maxFlashcardsPerGeneration", plan != null && plan.getMaxFlashcardsPerGeneration() != null ? plan.getMaxFlashcardsPerGeneration() : (tier == SubscriptionTier.PRO ? -1 : 15));
        result.put("maxQuizQuestionsPerGeneration", plan != null && plan.getMaxQuizQuestionsPerGeneration() != null ? plan.getMaxQuizQuestionsPerGeneration() : (tier == SubscriptionTier.PRO ? 50 : 20));
        result.put("maxOwnedProjects", plan != null && plan.getMaxOwnedProjects() != null ? plan.getMaxOwnedProjects() : (tier == SubscriptionTier.PRO ? -1 : 3));
        result.put("maxJoinedProjects", plan != null && plan.getMaxJoinedProjects() != null ? plan.getMaxJoinedProjects() : (tier == SubscriptionTier.PRO ? -1 : 5));
        result.put("canCancel", tier == SubscriptionTier.PRO);

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

        if (user.getSubscriptionTier() == SubscriptionTier.FREE) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tài khoản của bạn hiện đã là gói Miễn Phí (FREE)."));
        }

        // Downgrade user to FREE tier
        user.setSubscriptionTier(SubscriptionTier.FREE);
        userRepository.save(user);

        // Send notification
        try {
            notificationService.createNotification(
                    user,
                    null,
                    NotificationType.PRO_CANCELLED,
                    "Hủy gói PRO thành công",
                    "Gói dịch vụ PRO của bạn đã được hủy. Tài khoản của bạn đã quay trở lại gói Miễn Phí (FREE).",
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
