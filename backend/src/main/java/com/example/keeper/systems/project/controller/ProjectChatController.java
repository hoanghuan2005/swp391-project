package com.example.keeper.systems.project.controller;

import com.example.keeper.systems.project.entity.ProjectChatMessage;
import com.example.keeper.systems.project.repository.ProjectChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectChatController {

    private final ProjectChatMessageRepository chatMessageRepository;

    @GetMapping("/{id}/messages")
    public List<ProjectChatMessage> getChatHistory(@PathVariable UUID id) {
        return chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(id);
    }
}
