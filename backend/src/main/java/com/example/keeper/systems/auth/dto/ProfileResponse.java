package com.example.keeper.systems.auth.dto;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProfileResponse {

    private String fullName;
    private String email;
    private String avatarUrl;
    private String schoolCode;
    private String schoolName;
    private Integer startYear;
    private List<String> languages;
    private long uploads;
    private int followers;
    private int upvotes;
}
