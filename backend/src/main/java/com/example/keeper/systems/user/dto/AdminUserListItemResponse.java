package com.example.keeper.systems.user.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminUserListItemResponse {

    private UUID id;
    private String username;
    private String email;
    private String roleName;
    private String subscriptionTier;
    private boolean emailVerified;
    private boolean banned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long totalDocuments;
    private long publicDocuments;
    private long privateDocuments;
    private long storageUsedBytes;
    private long aiUsageToday;
    private long aiDailyLimit;
    private long aiRemainingToday;
}
