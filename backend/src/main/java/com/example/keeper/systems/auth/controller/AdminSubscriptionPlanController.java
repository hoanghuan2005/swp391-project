package com.example.keeper.systems.auth.controller;

import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.SubscriptionPlanRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.service.EmailService;
import com.example.keeper.systems.notification.enums.NotificationType;
import com.example.keeper.systems.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/subscription-plans")
@RequiredArgsConstructor
@Slf4j
public class AdminSubscriptionPlanController {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<List<SubscriptionPlan>> getAllPlans() {
        return ResponseEntity.ok(subscriptionPlanRepository.findAllByOrderByPriceVndAsc());
    }

    @PostMapping
    public ResponseEntity<SubscriptionPlan> createPlan(@RequestBody SubscriptionPlan plan) {
        if (plan.getCode() != null) {
            plan.setCode(plan.getCode().toUpperCase().trim());
        }
        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        notifyAffectedUsers(saved);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubscriptionPlan> updatePlan(
            @PathVariable UUID id,
            @RequestBody SubscriptionPlan updateData) {

        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found: " + id));

        if (updateData.getName() != null) plan.setName(updateData.getName());
        if (updateData.getPriceVnd() != null) plan.setPriceVnd(updateData.getPriceVnd());
        if (updateData.getMaxFileSizeBytes() != null) plan.setMaxFileSizeBytes(updateData.getMaxFileSizeBytes());
        if (updateData.getTotalStorageBytes() != null) plan.setTotalStorageBytes(updateData.getTotalStorageBytes());
        if (updateData.getDailyUploadLimit() != null) plan.setDailyUploadLimit(updateData.getDailyUploadLimit());
        if (updateData.getTotalDocumentLimit() != null) plan.setTotalDocumentLimit(updateData.getTotalDocumentLimit());
        if (updateData.getDailyAiLimit() != null) plan.setDailyAiLimit(updateData.getDailyAiLimit());
        if (updateData.getMaxFlashcardsPerGeneration() != null) plan.setMaxFlashcardsPerGeneration(updateData.getMaxFlashcardsPerGeneration());
        if (updateData.getMaxQuizQuestionsPerGeneration() != null) plan.setMaxQuizQuestionsPerGeneration(updateData.getMaxQuizQuestionsPerGeneration());
        if (updateData.getMaxOwnedProjects() != null) plan.setMaxOwnedProjects(updateData.getMaxOwnedProjects());
        if (updateData.getMaxJoinedProjects() != null) plan.setMaxJoinedProjects(updateData.getMaxJoinedProjects());
        if (updateData.getMaxSelectedDocs() != null) plan.setMaxSelectedDocs(updateData.getMaxSelectedDocs());
        if (updateData.getMaxWorkspaceDocs() != null) plan.setMaxWorkspaceDocs(updateData.getMaxWorkspaceDocs());
        if (updateData.getMaxAiContextChunks() != null) plan.setMaxAiContextChunks(updateData.getMaxAiContextChunks());
        if (updateData.getMaxChunkChars() != null) plan.setMaxChunkChars(updateData.getMaxChunkChars());
        plan.setIsActive(updateData.getIsActive());

        SubscriptionPlan updated = subscriptionPlanRepository.save(plan);
        notifyAffectedUsers(updated);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<SubscriptionPlan> togglePlanStatus(@PathVariable UUID id) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found: " + id));

        plan.setIsActive(!plan.getIsActive());
        SubscriptionPlan updated = subscriptionPlanRepository.save(plan);
        notifyAffectedUsers(updated);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable UUID id) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found: " + id));

        subscriptionPlanRepository.delete(plan);
        return ResponseEntity.noContent().build();
    }

    private void notifyAffectedUsers(SubscriptionPlan plan) {
        if (plan == null || plan.getCode() == null) return;
        try {
            String cleanCode = plan.getCode().trim().toUpperCase();
            List<User> affectedUsers = userRepository.findBySubscriptionTier(cleanCode);

            log.info("Sending plan update notification for plan {} to {} affected users", plan.getName(), affectedUsers.size());

            for (User user : affectedUsers) {
                try {
                    // 1. Create In-App Notification
                    notificationService.createNotification(
                            user,
                            null,
                            NotificationType.PLAN_UPDATED,
                            plan.getName() + " Policy Updated",
                            "Notice: Operating policy and limits for " + plan.getName() + " have been updated by administrators. Please check pricing details for full information.",
                            null,
                            null
                    );

                    // 3. Send Email Notification
                    if (user.getEmail() != null && !user.getEmail().isBlank()) {
                        emailService.sendPlanUpdateEmail(user.getEmail(), plan.getName(), user.getUsername());
                    }
                } catch (Exception e) {
                    log.error("Failed to notify user {} of plan update: {}", user.getEmail(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to resolve tier for plan code {}: {}", plan.getCode(), e.getMessage());
        }
    }
}
