package com.example.keeper.systems.profile.dto.request;

import java.util.List;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {

    private String fullName;

    private String schoolCode;

    private String schoolName;

    private Integer startYear;

    private List<UUID> languageIds;

    private String avatarUrl;
}
