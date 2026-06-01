package com.example.keeper.systems.document.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentDetailResponse {

    private UUID id;
    private String title;
    private String description;
    private String fileUrl;
    private String previewUrl;
    private String downloadUrl;
    private String fileType;
    private String resourceType;
    private String mimeType;
    private String originalFileName;
    private Long fileSize;
    private String visibility;
    private String aiParseStatus;
    private Integer downloadCount;
    private LocalDateTime createdAt;
    private CourseInfo course;
    private UserInfo uploadedBy;
    private List<String> tags;

    @Data
    @Builder
    public static class CourseInfo {
        private UUID id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    public static class UserInfo {
        private UUID id;
        private String username;
        private String email;
    }
}
