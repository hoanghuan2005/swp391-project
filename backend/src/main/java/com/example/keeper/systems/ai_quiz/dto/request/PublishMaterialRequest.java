package com.example.keeper.systems.ai_quiz.dto.request;

import lombok.Data;
import java.util.UUID;
import java.util.List;

@Data
public class PublishMaterialRequest {
    private UUID courseId;
    private List<UUID> courseIds;
    private String visibility;
}

