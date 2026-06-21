package com.example.keeper.systems.document.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentReviewResponse {
    private UUID id;
    private UUID documentId;
    private UUID userId;
    private String userName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
