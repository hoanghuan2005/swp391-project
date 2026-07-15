package com.example.keeper.systems.project.service.impl;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.service.EmailService;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.notification.enums.NotificationType;
import com.example.keeper.systems.notification.enums.ReferenceType;
import com.example.keeper.systems.notification.service.NotificationService;
import com.example.keeper.systems.project.dto.request.CreateProjectRequest;
import com.example.keeper.systems.project.dto.response.ProjectDetailResponse;
import com.example.keeper.systems.project.entity.Project;
import com.example.keeper.systems.project.entity.ProjectInvitation;
import com.example.keeper.systems.project.entity.ProjectMember;
import com.example.keeper.systems.project.entity.ProjectRole;
import com.example.keeper.systems.project.entity.ProjectVisibility;
import com.example.keeper.systems.project.repository.ProjectInvitationRepository;
import com.example.keeper.systems.project.repository.ProjectMemberRepository;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final com.example.keeper.systems.ai_quiz.repository.QuizRepository quizRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInvitationRepository projectInvitationRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

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
        project.setVisibility(ProjectVisibility.PRIVATE);

        Project savedProject = projectRepository.save(project);

        // Add creator as OWNER in project_members
        ProjectMember ownerMember = new ProjectMember();
        ownerMember.setProject(savedProject);
        ownerMember.setUser(user);
        ownerMember.setRole(ProjectRole.OWNER);
        projectMemberRepository.save(ownerMember);

        return mapToResponse(savedProject, user);
    }

    @Override
    @Transactional
    public ProjectDetailResponse addDocument(UUID projectId, UUID documentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        boolean isOwner = project.getOwner().getId().equals(user.getId());
        ProjectRole role = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .map(ProjectMember::getRole)
                .orElse(isOwner ? ProjectRole.OWNER : null);

        if (role != ProjectRole.OWNER && role != ProjectRole.EDITOR) {
            throw new RuntimeException("You do not have permission to modify documents in this workspace");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        project.getDocuments().add(document);
        Project savedProject = projectRepository.save(project);

        // Notify other members
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        for (ProjectMember pm : members) {
            if (!pm.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(
                        pm.getUser(),
                        user,
                        NotificationType.WORKSPACE_DOCUMENT_ADDED,
                        "Document Added",
                        "A new document \"" + document.getTitle() + "\" was added to workspace \"" + project.getName() + "\".",
                        project.getId(),
                        ReferenceType.WORKSPACE
                );
            }
        }

        return mapToResponse(savedProject, user);
    }

    @Override
    @Transactional
    public ProjectDetailResponse removeDocument(UUID projectId, UUID documentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        boolean isOwner = project.getOwner().getId().equals(user.getId());
        ProjectRole role = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .map(ProjectMember::getRole)
                .orElse(isOwner ? ProjectRole.OWNER : null);

        if (role != ProjectRole.OWNER && role != ProjectRole.EDITOR) {
            throw new RuntimeException("You do not have permission to modify documents in this workspace");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        project.getDocuments().remove(document);
        Project savedProject = projectRepository.save(project);

        // Notify other members
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        for (ProjectMember pm : members) {
            if (!pm.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(
                        pm.getUser(),
                        user,
                        NotificationType.WORKSPACE_DOCUMENT_DELETED,
                        "Document Removed",
                        "Document \"" + document.getTitle() + "\" was removed from workspace \"" + project.getName() + "\".",
                        project.getId(),
                        ReferenceType.WORKSPACE
                );
            }
        }

        return mapToResponse(savedProject, user);
    }

    @Override
    @Transactional
    public void delete(UUID projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        boolean isOwner = project.getOwner().getId().equals(user.getId());
        if (!isOwner) {
            throw new RuntimeException("Only the workspace owner can delete it");
        }

        // Delete members and invitations first to avoid foreign key violations
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        projectMemberRepository.deleteAll(members);

        List<ProjectInvitation> invitations = projectInvitationRepository.findByProjectId(projectId);
        projectInvitationRepository.deleteAll(invitations);

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
        
        if (project.getVisibility() != ProjectVisibility.LINK_SHARED) {
            throw new RuntimeException("This link-shared workspace is currently set to private or public.");
        }
        
        return mapToResponse(project, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDetailResponse> getMyProjects(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<Project> projects = new HashSet<>(projectRepository.findByOwnerId(user.getId()));
        projectMemberRepository.findByUserId(user.getId()).forEach(pm -> projects.add(pm.getProject()));

        return projects.stream()
                .map(p -> mapToResponse(p, user))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDetailResponse getById(UUID id, String userEmail) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User currentUser = null;
        if (userEmail != null && !"anonymousUser".equals(userEmail)) {
            currentUser = userRepository.findByEmail(userEmail).orElse(null);
        }

        boolean isOwner = currentUser != null && project.getOwner().getId().equals(currentUser.getId());
        boolean isMember = currentUser != null && projectMemberRepository.existsByProjectIdAndUserId(project.getId(), currentUser.getId());

        if (project.getVisibility() == ProjectVisibility.PRIVATE) {
            if (!isOwner && !isMember) {
                throw new RuntimeException("Access denied. This workspace is private.");
            }
        } else if (project.getVisibility() == ProjectVisibility.PUBLIC) {
            if (currentUser == null) {
                throw new RuntimeException("Access denied. Please log in to view public workspaces.");
            }
        }

        return mapToResponse(project, currentUser);
    }

    @Override
    @Transactional
    public ProjectDetailResponse updateVisibility(UUID projectId, String visibility, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        boolean isOwner = project.getOwner().getId().equals(user.getId());
        if (!isOwner) {
            throw new RuntimeException("Only the workspace owner can change its visibility");
        }

        project.setVisibility(ProjectVisibility.valueOf(visibility.toUpperCase()));
        Project saved = projectRepository.save(project);

        // Notify other members
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        for (ProjectMember pm : members) {
            if (!pm.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(
                        pm.getUser(),
                        user,
                        NotificationType.WORKSPACE_UPDATED,
                        "Workspace Settings Updated",
                        "The visibility of workspace \"" + project.getName() + "\" has been set to " + visibility + ".",
                        project.getId(),
                        ReferenceType.WORKSPACE
                );
            }
        }

        return mapToResponse(saved, user);
    }

    @Override
    @Transactional
    public ProjectDetailResponse updateInfo(UUID projectId, String name, String description, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        boolean isOwner = project.getOwner().getId().equals(user.getId());
        ProjectRole role = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .map(ProjectMember::getRole)
                .orElse(isOwner ? ProjectRole.OWNER : null);

        if (role != ProjectRole.OWNER && role != ProjectRole.EDITOR) {
            throw new RuntimeException("You do not have permission to edit this workspace");
        }

        project.setName(name);
        project.setDescription(description);
        Project saved = projectRepository.save(project);

        // Notify other members
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        for (ProjectMember pm : members) {
            if (!pm.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(
                        pm.getUser(),
                        user,
                        NotificationType.WORKSPACE_UPDATED,
                        "Workspace Details Updated",
                        "Workspace \"" + project.getName() + "\" details were updated.",
                        project.getId(),
                        ReferenceType.WORKSPACE
                );
            }
        }

        return mapToResponse(saved, user);
    }

    @Override
    @Transactional
    public void inviteMember(UUID projectId, String email, String role, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        boolean isOwner = project.getOwner().getId().equals(user.getId());
        if (!isOwner) {
            throw new RuntimeException("Only the workspace owner can invite members");
        }

        Optional<User> inviteeOpt = userRepository.findByEmail(email);
        if (inviteeOpt.isPresent()) {
            User invitee = inviteeOpt.get();
            if (project.getOwner().getId().equals(invitee.getId()) ||
                    projectMemberRepository.existsByProjectIdAndUserId(projectId, invitee.getId())) {
                throw new RuntimeException("User is already a member of this workspace");
            }
        }

        if (projectInvitationRepository.existsByProjectIdAndEmailAndStatus(projectId, email, "PENDING")) {
            throw new RuntimeException("An invitation is already pending for this email");
        }

        String token = UUID.randomUUID().toString();
        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProject(project);
        invitation.setEmail(email);
        invitation.setRole(ProjectRole.valueOf(role.toUpperCase()));
        invitation.setToken(token);
        invitation.setInviter(user);
        invitation.setStatus("PENDING");
        invitation.setExpiresAt(LocalDateTime.now().plusHours(24));
        projectInvitationRepository.save(invitation);

        String inviterName = user.getUsername() != null ? user.getUsername() : user.getEmail();
        emailService.sendWorkspaceInvitationEmail(email, inviterName, project.getName(), token);

        if (inviteeOpt.isPresent()) {
            notificationService.createNotification(
                    inviteeOpt.get(),
                    user,
                    NotificationType.WORKSPACE_INVITED,
                    "Workspace Invitation",
                    inviterName + " has invited you to join workspace \"" + project.getName() + "\" as " + role + ".",
                    project.getId(),
                    ReferenceType.WORKSPACE
            );
        }
    }

    @Override
    @Transactional
    public ProjectDetailResponse acceptInvitation(String token, String userEmail) {
        ProjectInvitation invitation = verifyInvitationToken(token);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("This invitation was sent to a different email address");
        }

        // Check if already a member
        if (projectMemberRepository.existsByProjectIdAndUserId(invitation.getProject().getId(), user.getId())) {
            invitation.setStatus("ACCEPTED");
            projectInvitationRepository.save(invitation);
            return mapToResponse(invitation.getProject(), user);
        }

        ProjectMember member = new ProjectMember();
        member.setProject(invitation.getProject());
        member.setUser(user);
        member.setRole(invitation.getRole());
        projectMemberRepository.save(member);

        invitation.setStatus("ACCEPTED");
        projectInvitationRepository.save(invitation);

        // Notify inviter
        notificationService.createNotification(
                invitation.getInviter(),
                user,
                NotificationType.WORKSPACE_INVITATION_ACCEPTED,
                "Invitation Accepted",
                user.getEmail() + " has accepted your invitation to join \"" + invitation.getProject().getName() + "\".",
                invitation.getProject().getId(),
                ReferenceType.WORKSPACE
        );

        // Notify other members
        List<ProjectMember> members = projectMemberRepository.findByProjectId(invitation.getProject().getId());
        for (ProjectMember pm : members) {
            if (!pm.getUser().getId().equals(user.getId()) && !pm.getUser().getId().equals(invitation.getInviter().getId())) {
                notificationService.createNotification(
                        pm.getUser(),
                        user,
                        NotificationType.WORKSPACE_MEMBER_JOINED,
                        "New Member Joined",
                        user.getEmail() + " has joined the workspace.",
                        invitation.getProject().getId(),
                        ReferenceType.WORKSPACE
                );
            }
        }

        return mapToResponse(invitation.getProject(), user);
    }

    @Override
    @Transactional
    public void rejectInvitation(String token, String userEmail) {
        ProjectInvitation invitation = verifyInvitationToken(token);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("This invitation was sent to a different email address");
        }

        invitation.setStatus("REJECTED");
        projectInvitationRepository.save(invitation);
    }

    @Override
    @Transactional
    public void changeMemberRole(UUID projectId, UUID userId, String role, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        boolean isOwner = project.getOwner().getId().equals(user.getId());
        if (!isOwner) {
            throw new RuntimeException("Only the workspace owner can manage member roles");
        }

        if (project.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Cannot change the role of the workspace owner");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found in this workspace"));

        member.setRole(ProjectRole.valueOf(role.toUpperCase()));
        projectMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void removeMember(UUID projectId, UUID userId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        boolean isOwner = project.getOwner().getId().equals(user.getId());
        if (!isOwner) {
            throw new RuntimeException("Only the workspace owner can remove members");
        }

        if (project.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Cannot remove the owner of the workspace");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found in this workspace"));

        projectMemberRepository.delete(member);
    }

    @Override
    @Transactional
    public ProjectInvitation verifyInvitationToken(String token) {
        ProjectInvitation invitation = projectInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation link"));

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new IllegalArgumentException("This invitation has already been " + invitation.getStatus().toLowerCase());
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            projectInvitationRepository.save(invitation);
            throw new IllegalArgumentException("This invitation has expired");
        }

        return invitation;
    }

    private ProjectDetailResponse mapToResponse(Project project, User currentUser) {
        List<ProjectDetailResponse.DocumentInfo> docInfos = project.getDocuments().stream()
                .map(doc -> ProjectDetailResponse.DocumentInfo.builder()
                        .id(doc.getId())
                        .title(doc.getTitle())
                        .fileType(resolveFileType(doc))
                        .mimeType(doc.getMimeType())
                        .description(doc.getDescription())
                        .aiParseStatus(doc.getAiParseStatus() == null ? null : doc.getAiParseStatus().name())
                        .downloadCount(doc.getDownloadCount() != null ? doc.getDownloadCount() : 0)
                        .viewCount(doc.getViewCount() != null ? doc.getViewCount() : 0)
                        .createdAt(doc.getCreatedAt())
                        .course(doc.getCourse() == null ? null : ProjectDetailResponse.CourseInfo.builder()
                                .id(doc.getCourse().getId())
                                .code(doc.getCourse().getCode())
                                .name(doc.getCourse().getName())
                                .build())
                        .build())
                .collect(Collectors.toList());

        String userRole = null;
        if (currentUser != null) {
            if (project.getOwner().getId().equals(currentUser.getId())) {
                userRole = ProjectRole.OWNER.name();
            } else {
                userRole = projectMemberRepository.findByProjectIdAndUserId(project.getId(), currentUser.getId())
                        .map(pm -> pm.getRole().name())
                        .orElse(null);
            }
        }

        // Fetch member list details
        List<ProjectMember> pmList = projectMemberRepository.findByProjectId(project.getId());
        boolean hasOwner = pmList.stream().anyMatch(pm -> pm.getRole() == ProjectRole.OWNER);
        List<ProjectDetailResponse.MemberInfo> memberInfos = pmList.stream()
                .map(pm -> ProjectDetailResponse.MemberInfo.builder()
                        .userId(pm.getUser().getId())
                        .username(pm.getUser().getUsername())
                        .email(pm.getUser().getEmail())
                        .role(pm.getRole().name())
                        .avatarUrl(pm.getUser().getAvatarUrl())
                        .build())
                .collect(Collectors.toList());
        if (!hasOwner) {
            memberInfos.add(0, ProjectDetailResponse.MemberInfo.builder()
                    .userId(project.getOwner().getId())
                    .username(project.getOwner().getUsername())
                    .email(project.getOwner().getEmail())
                    .role(ProjectRole.OWNER.name())
                    .avatarUrl(project.getOwner().getAvatarUrl())
                    .build());
        }

        return ProjectDetailResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .shareToken(project.getShareToken())
                .ownerId(project.getOwner().getId())
                .createdAt(project.getCreatedAt())
                .documents(docInfos)
                .visibility(project.getVisibility().name())
                .currentUserRole(userRole)
                .members(memberInfos)
                .build();
    }

    private String resolveFileType(Document document) {
        String originalFileName = document.getOriginalFileName();
        if (originalFileName != null) {
            int extensionIndex = originalFileName.lastIndexOf('.');
            if (extensionIndex > 0 && extensionIndex < originalFileName.length() - 1) {
                return originalFileName.substring(extensionIndex + 1).toLowerCase();
            }
        }
        return document.getMimeType();
    }

    @Override
    public Map<String, Object> getMyInvitationStatus(UUID projectId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is already a member
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId());
        if (isMember) {
            return Map.of("isMember", true);
        }

        // Look up the latest invitation for this user + project
        var invitationOpt = projectInvitationRepository.findFirstByProjectIdAndEmailOrderByCreatedAtDesc(projectId, userEmail);
        if (invitationOpt.isEmpty()) {
            return Map.of("isMember", false, "invitation", Map.of());
        }

        var invitation = invitationOpt.get();
        String inviterName = invitation.getInviter().getUsername() != null
                ? invitation.getInviter().getUsername()
                : invitation.getInviter().getEmail();

        return Map.of(
                "isMember", false,
                "invitation", Map.of(
                        "token", invitation.getToken(),
                        "status", invitation.getStatus(),
                        "role", invitation.getRole().name(),
                        "projectName", invitation.getProject().getName(),
                        "inviterName", inviterName
                )
        );
    }
}
