package com.example.keeper.systems.document.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DocumentResponse {

    private UUID id;
    private String title;
    private String fileType;
    private String resourceType;
    private String previewUrl;
    private String downloadUrl;
    private String mimeType;
    private String visibility;
    private String aiParseStatus;
    private Integer downloadCount;
    private LocalDateTime createdAt;
    private LocalDateTime lastViewedAt;
    private CourseInfo course;
    private List<String> tags;

    @Data
    @Builder
    public static class CourseInfo {
        private UUID id;
        private String code;
        private String name;
    }
}
