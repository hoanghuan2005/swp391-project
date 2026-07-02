package com.example.keeper.systems.dashboard.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalUsers;
    private long activeUsers;
    private long bannedUsers;
    private long freeUsers;
    private long proUsers;
    private long totalCourses;
    private long totalDocuments;
    private long publicDocuments;
    private long privateDocuments;
    private long documentsPendingParse;
    private long documentsReadyForAi;
    private long documentsFailedParse;
    private long documentsUnsupportedForAi;
    private long totalSchools;
    private long totalTags;
    private long totalLanguages;
    private long totalMajors;
}
