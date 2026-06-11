package com.example.keeper.systems.ai_mindmap.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class GenerateMindMapRequest {

    private UUID documentId;

}