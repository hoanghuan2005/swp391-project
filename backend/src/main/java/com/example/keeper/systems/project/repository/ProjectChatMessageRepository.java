package com.example.keeper.systems.project.repository;

import com.example.keeper.systems.project.entity.ProjectChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProjectChatMessageRepository extends JpaRepository<ProjectChatMessage, UUID> {
    List<ProjectChatMessage> findByProjectIdOrderByCreatedAtAsc(UUID projectId);
}
