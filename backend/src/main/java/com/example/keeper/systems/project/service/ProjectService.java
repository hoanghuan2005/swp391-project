package com.example.keeper.systems.project.service;

import com.example.keeper.systems.project.dto.request.CreateProjectRequest;
import com.example.keeper.systems.project.dto.response.ProjectDetailResponse;
import com.example.keeper.systems.project.entity.ProjectInvitation;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    ProjectDetailResponse create(CreateProjectRequest request, String userEmail);
    ProjectDetailResponse addDocument(UUID projectId, UUID documentId, String userEmail);
    ProjectDetailResponse removeDocument(UUID projectId, UUID documentId, String userEmail);
    void delete(UUID projectId, String userEmail);
    ProjectDetailResponse getByShareToken(String token);
    List<ProjectDetailResponse> getMyProjects(String userEmail);
    ProjectDetailResponse getById(UUID id, String userEmail);

    // Workspace Sharing & Collaboration
    ProjectDetailResponse updateVisibility(UUID projectId, String visibility, String userEmail);
    ProjectDetailResponse updateInfo(UUID projectId, String name, String description, String userEmail);
    void inviteMember(UUID projectId, String email, String role, String userEmail);
    ProjectDetailResponse acceptInvitation(String token, String userEmail);
    void rejectInvitation(String token, String userEmail);
    void changeMemberRole(UUID projectId, UUID userId, String role, String userEmail);
    void removeMember(UUID projectId, UUID userId, String userEmail);
    ProjectInvitation verifyInvitationToken(String token);
}
