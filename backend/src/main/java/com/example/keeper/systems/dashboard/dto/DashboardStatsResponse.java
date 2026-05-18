package com.example.keeper.systems.dashboard.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalUsers;
    private long totalCourses;
    private long totalDocuments;
    private long totalSchools;
    private long totalTags;
    private long totalLanguages;
}
