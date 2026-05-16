package com.example.keeper.systems.auth.dto;

import java.util.Set;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SurveyRequest {

    private String schoolName;

    private Integer startYear;

    private Set<UUID> languageIds;
}