package com.example.keeper.systems.ai_usage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAiUsageResponse {
    private String planName;
    private Integer maxDailyAiRequests;
    private Integer usedAiRequestsToday;
    private Integer remainingUsage;
}
