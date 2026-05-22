package com.example.keeper.systems.ai_ask.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AskRequest {

    @NotNull
    private UUID documentId;

    @NotBlank
    private String question;
}