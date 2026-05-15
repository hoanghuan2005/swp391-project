package com.example.keeper.systems.user.dto;

import java.util.Set;

public class UserPreferenceResponse {

    private String school;
    private Integer studyStartYear;
    private Set<String> preferredLanguages;
    private boolean surveyCompleted;

    public UserPreferenceResponse(String school, Integer studyStartYear, Set<String> preferredLanguages,
            boolean surveyCompleted) {
        this.school = school;
        this.studyStartYear = studyStartYear;
        this.preferredLanguages = preferredLanguages;
        this.surveyCompleted = surveyCompleted;
    }

    public String getSchool() {
        return school;
    }

    public Integer getStudyStartYear() {
        return studyStartYear;
    }

    public Set<String> getPreferredLanguages() {
        return preferredLanguages;
    }

    public boolean isSurveyCompleted() {
        return surveyCompleted;
    }
}
