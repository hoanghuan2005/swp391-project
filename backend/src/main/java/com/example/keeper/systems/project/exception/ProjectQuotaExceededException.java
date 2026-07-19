package com.example.keeper.systems.project.exception;

/**
 * Thrown when a user exceeds their subscription tier's project/workspace quota.
 */
public class ProjectQuotaExceededException extends RuntimeException {

    public ProjectQuotaExceededException(String message) {
        super(message);
    }
}
