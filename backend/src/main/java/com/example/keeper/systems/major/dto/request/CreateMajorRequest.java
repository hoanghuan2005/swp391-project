package com.example.keeper.systems.major.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateMajorRequest {
    private String name;
    private String code;
    private String description;
    private UUID schoolId;
}
