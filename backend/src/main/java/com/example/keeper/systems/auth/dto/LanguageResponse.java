package com.example.keeper.systems.auth.dto;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LanguageResponse {

    private UUID id;
    private String code;
    private String name;
}
