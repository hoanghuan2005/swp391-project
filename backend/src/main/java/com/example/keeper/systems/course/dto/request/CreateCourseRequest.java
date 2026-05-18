package com.example.keeper.systems.course.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCourseRequest {

    private String code;

    private String name;

    private String description;
}
