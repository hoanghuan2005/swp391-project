package com.example.keeper.systems.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SchoolResponse {

    private UUID id;

    private String name;

    private String code;

    private String description;
}
