package com.example.keeper.systems.auth.dto;

import java.util.Set;
import lombok.*;

@Getter
@Setter
@Builder
public class SurveyResponse {

    private String schoolCode;

    private String schoolName;

    private Integer startYear;

    private Set<String> languages;
}
