package com.example.keeper.systems.user.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AdminUserDetailResponse {

    private UUID id;
    private String username;
    private String email;
    private String roleName;
    private String subscriptionTier;
    private boolean emailVerified;
    private boolean banned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String avatarUrl;
    private boolean surveyCompleted;
    private String schoolCode;
    private String schoolName;
    private Integer startYear;
    private String major;
    private List<LanguageSummary> languages;

    private long totalDocuments;
    private long publicDocuments;
    private long privateDocuments;
    private long storageUsedBytes;
    private List<RecentDocumentSummary> recentDocuments;

    private long aiUsageToday;
    private long aiDailyLimit;
    private long aiRemainingToday;
    private Map<String, Long> aiUsageByFeature;

    private long quizCount;
    private long flashcardSetCount;
    private long mindmapCount;
    private long projectOwnedCount;
    private long projectJoinedCount;

    private String latestPaymentStatus;
    private LocalDateTime latestPaymentDate;

    @Data
    @Builder
    public static class LanguageSummary {
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    public static class RecentDocumentSummary {
        private UUID id;
        private String title;
        private String visibility;
        private Long fileSize;
        private LocalDateTime createdAt;
        private String aiParseStatus;
    }
}
