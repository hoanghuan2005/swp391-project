package com.example.keeper.systems.ai_usage.service;

import com.example.keeper.systems.ai_usage.enums.AiUsageFeature;

public interface AiUsageService {
    void checkQuota(String email);

    void recordUsage(String email, AiUsageFeature feature);

    long getRemainingUsage(String email);
}
