package com.example.keeper.systems.follow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileSummaryResponse {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private long totalDocuments;
    private long followersCount;
    private long followingCount;
    @JsonProperty("isFollowedByCurrentUser")
    private boolean isFollowedByCurrentUser;
}
