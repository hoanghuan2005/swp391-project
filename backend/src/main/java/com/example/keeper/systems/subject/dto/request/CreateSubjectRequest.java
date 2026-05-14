package com.example.keeper.systems.subject.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSubjectRequest {

    private String code;

    private String name;

    private String description;
}