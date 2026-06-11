package com.example.keeper.systems.ai_mindmap.service;

import com.example.keeper.systems.ai_mindmap.dto.response.MindMapResponse;

import java.util.UUID;

public interface MindMapService {

    MindMapResponse generate(UUID documentId);

    MindMapResponse getByDocument(UUID documentId);

    void delete(UUID mindMapId);

}
