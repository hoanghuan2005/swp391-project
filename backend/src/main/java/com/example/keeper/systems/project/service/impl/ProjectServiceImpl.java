package com.example.keeper.systems.project.service.impl;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.project.dto.request.CreateProjectRequest;
import com.example.keeper.systems.project.dto.response.ProjectDetailResponse;
import com.example.keeper.systems.project.entity.Project;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final com.example.keeper.systems.ai_quiz.repository.QuizRepository quizRepository;

    @Override
    @Transactional
    public ProjectDetailResponse create(CreateProjectRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setOwner(user);
        project.setShareToken(UUID.randomUUID().toString());

        Project savedProject = projectRepository.save(project);
        return mapToResponse(savedProject);
    }

    @Override
    @Transactional
    public ProjectDetailResponse addDocument(UUID projectId, UUID documentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to modify this project");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        project.getDocuments().add(document);
        Project savedProject = projectRepository.save(project);
        
        return mapToResponse(savedProject);
    }

    @Override
    @Transactional
    public ProjectDetailResponse removeDocument(UUID projectId, UUID documentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to modify this project");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        project.getDocuments().remove(document);
        Project savedProject = projectRepository.save(project);

        return mapToResponse(savedProject);
    }

    @Override
    @Transactional
    public void delete(UUID projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to delete this project");
        }

        // Cascade delete related quizzes
        quizRepository.deleteByProjectId(projectId);

        // Delete the project itself
        projectRepository.delete(project);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDetailResponse getByShareToken(String token) {
        Project project = projectRepository.findByShareToken(token)
                .orElseThrow(() -> new RuntimeException("Project not found or invalid link"));
        return mapToResponse(project);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDetailResponse> getMyProjects(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return projectRepository.findByOwnerId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDetailResponse getById(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return mapToResponse(project);
    }

    private ProjectDetailResponse mapToResponse(Project project) {
        List<ProjectDetailResponse.DocumentInfo> docInfos = project.getDocuments().stream()
                .map(doc -> ProjectDetailResponse.DocumentInfo.builder()
                        .id(doc.getId())
                        .title(doc.getTitle())
                        .fileType(doc.getMimeType() != null ? doc.getMimeType() : doc.getOriginalFileName())
                        .aiParseStatus(doc.getAiParseStatus() == null ? null : doc.getAiParseStatus().name())
                        .build())
                .collect(Collectors.toList());

        return ProjectDetailResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .shareToken(project.getShareToken())
                .ownerId(project.getOwner().getId())
                .createdAt(project.getCreatedAt())
                .documents(docInfos)
                .build();
    }
}
