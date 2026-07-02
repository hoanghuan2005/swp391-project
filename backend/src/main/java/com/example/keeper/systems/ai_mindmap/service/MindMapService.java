package com.example.keeper.systems.ai_mindmap.service;

import com.example.keeper.systems.ai_mindmap.dto.response.MindMapResponse;

import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

public interface MindMapService {

    MindMapResponse generate(UUID documentId);

    MindMapResponse generateFromFile(MultipartFile file, String text, String title);

    MindMapResponse getByDocument(UUID documentId);

    void delete(UUID mindMapId);

    MindMapResponse renameMindMap(UUID id, String newTitle, String userEmail);

    List<MindMapResponse> getUserMindMaps();

}
