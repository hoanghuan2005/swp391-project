package com.example.keeper.systems.project.controller;

import com.example.keeper.systems.project.dto.request.CreateProjectRequest;
import com.example.keeper.systems.project.dto.response.ProjectDetailResponse;
import com.example.keeper.systems.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ProjectDetailResponse create(@RequestBody CreateProjectRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return projectService.create(request, email);
    }

    @GetMapping("/my-projects")
    public List<ProjectDetailResponse> getMyProjects() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return projectService.getMyProjects(email);
    }

    @GetMapping("/{id}")
    public ProjectDetailResponse getById(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication() != null ?
                SecurityContextHolder.getContext().getAuthentication().getName() : null;
        return projectService.getById(id, email);
    }

    @PostMapping("/{projectId}/documents/{documentId}")
    public ProjectDetailResponse addDocument(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return projectService.addDocument(projectId, documentId, email);
    }

    @DeleteMapping("/{projectId}/documents/{documentId}")
    public ProjectDetailResponse removeDocument(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return projectService.removeDocument(projectId, documentId, email);
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID projectId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        projectService.delete(projectId, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/shared/{token}")
    public ProjectDetailResponse getSharedProject(@PathVariable String token) {
        return projectService.getByShareToken(token);
    }

    // Workspace Visibility Updates
    @PutMapping("/{projectId}/visibility")
    public ProjectDetailResponse updateVisibility(
            @PathVariable UUID projectId,
            @RequestParam String visibility) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return projectService.updateVisibility(projectId, visibility, email);
    }

    @PutMapping("/{projectId}/info")
    public ProjectDetailResponse updateInfo(
            @PathVariable UUID projectId,
            @RequestParam String name,
            @RequestParam(required = false, defaultValue = "") String description) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return projectService.updateInfo(projectId, name, description, email);
    }

    // Member Invitations
    @PostMapping("/{projectId}/invitations")
    public ResponseEntity<Void> inviteMember(
            @PathVariable UUID projectId,
            @RequestParam String email,
            @RequestParam String role) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        projectService.inviteMember(projectId, email, role, currentEmail);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/invitations/{token}")
    public ResponseEntity<?> verifyInvitationToken(@PathVariable String token) {
        var invitation = projectService.verifyInvitationToken(token);
        return ResponseEntity.ok(Map.of(
                "id", invitation.getId(),
                "email", invitation.getEmail(),
                "role", invitation.getRole().name(),
                "projectName", invitation.getProject().getName(),
                "inviterName", invitation.getInviter().getUsername() != null ?
                        invitation.getInviter().getUsername() : invitation.getInviter().getEmail(),
                "status", invitation.getStatus(),
                "expiresAt", invitation.getExpiresAt()
        ));
    }

    @PostMapping("/invitations/{token}/accept")
    public ProjectDetailResponse acceptInvitation(@PathVariable String token) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return projectService.acceptInvitation(token, email);
    }

    @PostMapping("/invitations/{token}/reject")
    public ResponseEntity<Void> rejectInvitation(@PathVariable String token) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        projectService.rejectInvitation(token, email);
        return ResponseEntity.ok().build();
    }

    // Member Management
    @PutMapping("/{projectId}/members/{userId}")
    public ResponseEntity<Void> changeMemberRole(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            @RequestParam String role) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        projectService.changeMemberRole(projectId, userId, role, email);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID userId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        projectService.removeMember(projectId, userId, email);
        return ResponseEntity.ok().build();
    }
}
