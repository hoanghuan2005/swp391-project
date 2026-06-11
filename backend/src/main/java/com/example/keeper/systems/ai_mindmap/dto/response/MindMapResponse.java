package com.example.keeper.systems.ai_mindmap.dto.response;

import com.example.keeper.systems.ai_mindmap.enums.MindMapStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class MindMapResponse {

    private UUID id;

    private UUID documentId;

    private String title;

    private String content;

    private MindMapStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}