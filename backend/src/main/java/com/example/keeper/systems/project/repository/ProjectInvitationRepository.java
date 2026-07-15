package com.example.keeper.systems.project.repository;

import com.example.keeper.systems.project.entity.ProjectInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {
    Optional<ProjectInvitation> findByToken(String token);
    Optional<ProjectInvitation> findByProjectIdAndEmailAndStatus(UUID projectId, String email, String status);
    Optional<ProjectInvitation> findFirstByProjectIdAndEmailOrderByCreatedAtDesc(UUID projectId, String email);
    List<ProjectInvitation> findByProjectId(UUID projectId);
    boolean existsByProjectIdAndEmailAndStatus(UUID projectId, String email, String status);
}
