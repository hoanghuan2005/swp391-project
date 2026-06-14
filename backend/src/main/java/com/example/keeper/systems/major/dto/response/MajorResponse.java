package com.example.keeper.systems.major.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MajorResponse {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private UUID schoolId;
    private String schoolName;
    private String schoolCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
