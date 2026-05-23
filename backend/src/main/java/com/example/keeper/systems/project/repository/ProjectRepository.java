package com.example.keeper.systems.project.repository;

import com.example.keeper.systems.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByOwnerId(UUID ownerId);
    Optional<Project> findByShareToken(String shareToken);
}
