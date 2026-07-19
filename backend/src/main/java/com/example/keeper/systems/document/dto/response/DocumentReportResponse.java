package com.example.keeper.systems.document.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DocumentReportResponse {
    private UUID id;
    private UUID documentId;
    private String documentTitle;
    private UUID uploaderId;
    private String uploaderUsername;
    private String uploaderEmail;
    private boolean isUploaderBanned;
    private UUID reporterId;
    private String reporterUsername;
    private String reporterEmail;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
}
