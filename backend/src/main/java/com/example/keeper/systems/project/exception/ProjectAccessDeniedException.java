package com.example.keeper.systems.project.exception;

import lombok.Getter;

import java.util.UUID;

@Getter
public class ProjectAccessDeniedException extends RuntimeException {
    private final UUID projectId;
    private final String projectName;
    private final String ownerName;
    private final String visibility;

    public ProjectAccessDeniedException(UUID projectId, String projectName, String ownerName, String visibility) {
        super("Access denied. You need permission to access workspace: " + projectName);
        this.projectId = projectId;
        this.projectName = projectName;
        this.ownerName = ownerName;
        this.visibility = visibility;
    }
}
