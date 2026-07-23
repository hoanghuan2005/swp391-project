package com.example.keeper.systems.document.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.example.keeper.systems.document.enums.VersionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersionResponse {
    private UUID id;
    private UUID documentId;
    private String versionNumber;
    private String fileUrl;
    private String originalFileName;
    private Long fileSize;
    private String mimeType;
    private String changelog;
    private VersionStatus status;
    private String rejectionReason;
    private UUID uploaderId;
    private String uploaderName;
    private LocalDateTime createdAt;
}
