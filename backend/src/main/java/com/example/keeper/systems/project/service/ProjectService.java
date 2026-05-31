package com.example.keeper.systems.project.service;

import com.example.keeper.systems.project.dto.request.CreateProjectRequest;
import com.example.keeper.systems.project.dto.response.ProjectDetailResponse;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    ProjectDetailResponse create(CreateProjectRequest request, String userEmail);
    ProjectDetailResponse addDocument(UUID projectId, UUID documentId, String userEmail);
    ProjectDetailResponse removeDocument(UUID projectId, UUID documentId, String userEmail);
    void delete(UUID projectId, String userEmail);
    ProjectDetailResponse getByShareToken(String token);
    List<ProjectDetailResponse> getMyProjects(String userEmail);
    ProjectDetailResponse getById(UUID id);
}
