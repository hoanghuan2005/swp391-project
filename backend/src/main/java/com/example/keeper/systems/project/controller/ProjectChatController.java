package com.example.keeper.systems.project.controller;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.project.entity.Project;
import com.example.keeper.systems.project.entity.ProjectChatMessage;
import com.example.keeper.systems.project.entity.ProjectMemberStatus;
import com.example.keeper.systems.project.entity.ProjectVisibility;
import com.example.keeper.systems.project.repository.ProjectChatMessageRepository;
import com.example.keeper.systems.project.repository.ProjectMemberRepository;
import com.example.keeper.systems.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectChatController {

    private final ProjectChatMessageRepository chatMessageRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @GetMapping("/{id}/messages")
    public List<ProjectChatMessage> getMessages(@PathVariable UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found!"));

        //PUBLIC
        if (project.getVisibility() == ProjectVisibility.PUBLIC) {
            return chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(id);
        }

        //PRIVATE: verify user role
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (auth != null) ? auth.getName() : null;

        if (email != null && !email.equals("anonymousUser")) {
            User user = userRepository.findByEmail(email)
                    .orElse(null);
            if (user != null) {
                boolean isOwner = project.getOwner().getId().equals(user.getId());
                boolean isActiveMember = projectMemberRepository.existsByProjectIdAndUserIdAndStatus(id, user.getId(), ProjectMemberStatus.ACTIVE);

                if (isOwner || isActiveMember) {
                    return chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(id);
                }
            }
        }

        // tất cả trường hợp còn lại đều bị chặn
            throw new AccessDeniedException("You do not have access to this workspace chat.");
    }
}


