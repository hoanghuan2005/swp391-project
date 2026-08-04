package com.example.keeper.systems.project.repository;

import com.example.keeper.systems.project.entity.ProjectMember;
import com.example.keeper.systems.project.entity.ProjectMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);
    List<ProjectMember> findByProjectId(UUID projectId);
    List<ProjectMember> findByProjectIdAndStatus(UUID projectId, ProjectMemberStatus status);
    List<ProjectMember> findByUserId(UUID userId);
    long countByUserId(UUID userId);
    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
    boolean existsByProjectIdAndUserIdAndStatus(UUID projectId, UUID userId, ProjectMemberStatus status);
    Optional<ProjectMember> findByProjectIdAndUserIdAndStatus(UUID projectId, UUID userId, ProjectMemberStatus status);
}
