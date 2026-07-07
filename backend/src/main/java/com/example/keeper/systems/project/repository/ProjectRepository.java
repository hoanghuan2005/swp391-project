package com.example.keeper.systems.project.repository;

import com.example.keeper.systems.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByOwnerId(UUID ownerId);
    long countByOwnerId(UUID ownerId);
    Optional<Project> findByShareToken(String shareToken);

    @Query("SELECT COUNT(p) > 0 FROM Project p JOIN p.documents d LEFT JOIN ProjectMember pm ON pm.project = p WHERE d.id = :documentId AND (p.owner.id = :userId OR pm.user.id = :userId)")
    boolean hasUserAccessToDocumentThroughProjects(@Param("documentId") UUID documentId, @Param("userId") UUID userId);
}
