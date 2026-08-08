package com.example.keeper.systems.ai_usage.service.impl;

import com.example.keeper.systems.ai_usage.dto.UserAiUsageResponse;
import com.example.keeper.systems.ai_usage.entity.AiUsage;
import com.example.keeper.systems.ai_usage.enums.AiUsageFeature;
import com.example.keeper.systems.ai_usage.exception.AiQuotaExceededException;
import com.example.keeper.systems.ai_usage.exception.DocumentSelectionQuotaExceededException;
import com.example.keeper.systems.ai_usage.repository.AiUsageRepository;
import com.example.keeper.systems.ai_usage.service.AiUsageService;
import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.SubscriptionPlanRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AiUsageServiceImpl implements AiUsageService {

    private final UserRepository userRepository;
    private final AiUsageRepository aiUsageRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    public void checkQuota(String email) {
        User user = findUser(email);

        if (isAdmin(user)) {
            return;
        }

        UserAiUsageResponse usage = getUserAiUsage(email);
        if (usage.getMaxDailyAiRequests() != null && usage.getMaxDailyAiRequests() != -1 && usage.getRemainingUsage() <= 0) {
            throw new AiQuotaExceededException(
                    "Daily AI request limit reached."
            );
        }
    }

    @Override
    public void recordUsage(String email, AiUsageFeature feature) {
        User user = findUser(email);

        if (isAdmin(user)) {
            return;
        }

        AiUsage aiUsage = new AiUsage();
        aiUsage.setUser(user);
        aiUsage.setFeature(feature);

        aiUsageRepository.save(aiUsage);
    }

    @Override
    public long getRemainingUsage(String email) {
        return getUserAiUsage(email).getRemainingUsage();
    }

    @Override
    public UserAiUsageResponse getUserAiUsage(String email) {
        User user = findUser(email);
        String tierCode = user.getSubscriptionTier() != null ? user.getSubscriptionTier() : "FREE";

        SubscriptionPlan plan = subscriptionPlanRepository.findByCodeAndIsActiveTrue(tierCode)
                .orElseGet(() -> subscriptionPlanRepository.findByCode(tierCode).orElse(null));

        String planName = (plan != null && plan.getName() != null)
                ? plan.getName()
                : tierCode;

        int maxDailyAiRequests;
        if (isAdmin(user) || (plan != null && plan.getDailyAiLimit() != null && plan.getDailyAiLimit() < 0)) {
            maxDailyAiRequests = -1;
        } else if (plan != null && plan.getDailyAiLimit() != null) {
            maxDailyAiRequests = plan.getDailyAiLimit().intValue();
        } else {
            maxDailyAiRequests = 5;
        }

        int usedAiRequestsToday = (int) getTodayUsage(user);
        int remainingUsage = (maxDailyAiRequests == -1)
                ? -1
                : Math.max(0, maxDailyAiRequests - usedAiRequestsToday);

        int maxSelectedDocs = (plan != null && plan.getMaxSelectedDocs() != null) ? plan.getMaxSelectedDocs() : 2;
        int maxWorkspaceDocs = (plan != null && plan.getMaxWorkspaceDocs() != null) ? plan.getMaxWorkspaceDocs() : 10;
        int maxAiContextChunks = (plan != null && plan.getMaxAiContextChunks() != null) ? plan.getMaxAiContextChunks() : 4;
        int maxChunkChars = (plan != null && plan.getMaxChunkChars() != null) ? plan.getMaxChunkChars() : 400;

        return UserAiUsageResponse.builder()
                .planName(planName)
                .subscriptionTier(tierCode)
                .maxDailyAiRequests(maxDailyAiRequests)
                .usedAiRequestsToday(usedAiRequestsToday)
                .remainingUsage(remainingUsage)
                .maxSelectedDocs(maxSelectedDocs)
                .maxWorkspaceDocs(maxWorkspaceDocs)
                .maxAiContextChunks(maxAiContextChunks)
                .maxChunkChars(maxChunkChars)
                .build();
    }

    @Override
    public void checkDocumentSelectionLimit(String email, int selectedCount) {
        User user = findUser(email);
        if (isAdmin(user)) {
            return;
        }

        String tierCode = user.getSubscriptionTier() != null ? user.getSubscriptionTier() : "FREE";
        SubscriptionPlan plan = subscriptionPlanRepository.findByCodeAndIsActiveTrue(tierCode)
                .orElseGet(() -> subscriptionPlanRepository.findByCode(tierCode).orElse(null));

        int maxAllowed = plan != null && plan.getMaxSelectedDocs() != null
                ? plan.getMaxSelectedDocs()
                : 2;

        if (maxAllowed != -1 && selectedCount > maxAllowed) {
            throw new DocumentSelectionQuotaExceededException(
                    "The " + tierCode + " plan only allows you to select up to " + maxAllowed + " documents at a time."
            );
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByUsername(email)
                        .orElseThrow(() -> new RuntimeException("User not found")));
    }

    private long getTodayUsage(User user) {
        LocalDate today = LocalDate.now();

        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        return aiUsageRepository.countByUserIdAndCreatedAtBetween(user.getId(), start, end);
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equals(user.getRole().getName());
    }
}

