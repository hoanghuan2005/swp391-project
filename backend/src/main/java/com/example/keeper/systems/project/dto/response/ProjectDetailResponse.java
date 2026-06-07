package com.example.keeper.systems.project.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProjectDetailResponse {
    private UUID id;
    private String name;
    private String description;
    private String shareToken;
    private UUID ownerId;
    private LocalDateTime createdAt;
    private List<DocumentInfo> documents;

    @Data
    @Builder
    public static class DocumentInfo {
        private UUID id;
        private String title;
        private String fileType;
        private String aiParseStatus;
    }
}
