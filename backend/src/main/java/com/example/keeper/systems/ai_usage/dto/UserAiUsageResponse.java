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
    private String subscriptionTier;
    private Integer maxDailyAiRequests;
    private Integer usedAiRequestsToday;
    private Integer remainingUsage;
    private Integer maxSelectedDocs;
    private Integer maxWorkspaceDocs;
    private Integer maxAiContextChunks;
    private Integer maxChunkChars;
}
