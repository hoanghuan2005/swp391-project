package com.example.keeper.systems.project.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProjectRequest {
    private String name;
    private String description;
}
