package com.example.keeper.systems.ai_usage.service.impl;

import com.example.keeper.systems.ai_usage.entity.AiUsage;
import com.example.keeper.systems.ai_usage.enums.AiUsageFeature;
import com.example.keeper.systems.ai_usage.exception.AiQuotaExceededException;
import com.example.keeper.systems.ai_usage.repository.AiUsageRepository;
import com.example.keeper.systems.ai_usage.service.AiUsageService;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.enums.SubscriptionTier;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AiUsageServiceImpl implements AiUsageService {


    private static final long FREE_DAILY_LIMIT = 20;

    private final UserRepository userRepository;
    private final AiUsageRepository aiUsageRepository;

    @Override
    public void checkQuota(String email) {
        User user = findUser(email);

        if (user.getSubscriptionTier() == SubscriptionTier.PRO) {
            return;
        }

        long used = getTodayUsage(user);

        if (used >= FREE_DAILY_LIMIT) {
            throw new AiQuotaExceededException(
                    "Daily AI request limit reached."
            );
        }
    }

    @Override
    public void recordUsage(String email, AiUsageFeature feature) {
        User user = findUser(email);

        AiUsage aiUsage = new AiUsage();
        aiUsage.setUser(user);
        aiUsage.setFeature(feature);

        aiUsageRepository.save(aiUsage);
    }

    @Override
    public long getRemainingUsage(String email) {
        User user = findUser(email);

        if (user.getSubscriptionTier() == SubscriptionTier.PRO) {
            return -1;
        }

        long used = getTodayUsage(user);
        return Math.max(0, FREE_DAILY_LIMIT - used);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private long getTodayUsage(User user) {
        LocalDate today = LocalDate.now();

        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        return aiUsageRepository.countByUserIdAndCreatedAtBetween(user.getId(), start, end);
    }
}
