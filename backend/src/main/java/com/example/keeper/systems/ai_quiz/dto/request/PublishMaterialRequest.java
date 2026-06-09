package com.example.keeper.systems.ai_quiz.dto.request;

import lombok.Data;
import java.util.UUID;

@Data
public class PublishMaterialRequest {
    private UUID courseId;
    private String visibility;
}
