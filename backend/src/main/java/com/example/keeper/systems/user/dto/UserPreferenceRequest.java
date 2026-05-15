package com.example.keeper.systems.user.dto;

import java.util.Set;

public class UserPreferenceRequest {

    private String school;
    private Integer studyStartYear;
    private Set<String> preferredLanguages;

    public String getSchool() {
        return school;
    }

    public void setSchool(String school) {
        this.school = school;
    }

    public Integer getStudyStartYear() {
        return studyStartYear;
    }

    public void setStudyStartYear(Integer studyStartYear) {
        this.studyStartYear = studyStartYear;
    }

    public Set<String> getPreferredLanguages() {
        return preferredLanguages;
    }

    public void setPreferredLanguages(Set<String> preferredLanguages) {
        this.preferredLanguages = preferredLanguages;
    }
}
