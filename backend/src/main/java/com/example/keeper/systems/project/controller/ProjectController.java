package com.example.keeper.systems.project.controller;

import com.example.keeper.systems.project.dto.request.CreateProjectRequest;
import com.example.keeper.systems.project.dto.response.ProjectDetailResponse;
import com.example.keeper.systems.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
        return projectService.getById(id);
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


}
