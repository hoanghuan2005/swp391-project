package com.example.keeper.config;

import com.example.keeper.systems.ai_usage.exception.AiQuotaExceededException;
import com.example.keeper.systems.project.exception.ProjectQuotaExceededException;
import jakarta.persistence.EntityNotFoundException;
import com.example.keeper.systems.document.exception.DocumentQuotaExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(EntityNotFoundException.class)
        public ResponseEntity<Map<String, Object>> handleEntityNotFoundException(EntityNotFoundException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "code", "NOT_FOUND",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(NoSuchElementException.class)
        public ResponseEntity<Map<String, Object>> handleNoSuchElementException(NoSuchElementException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "code", "NOT_FOUND",
                                                "message",
                                                ex.getMessage() != null ? ex.getMessage() : "Resource not found"));
        }

        @ExceptionHandler(AiQuotaExceededException.class)
        public ResponseEntity<Map<String, Object>> handleAiQuotaExceededException(AiQuotaExceededException ex) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                                .body(Map.of(
                                                "code", "AI_QUOTA_EXCEEDED",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "code", "BAD_REQUEST",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(DocumentQuotaExceededException.class)
        public ResponseEntity<Map<String, Object>> handleDocumentQuotaExceededException(
                        DocumentQuotaExceededException ex) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                                .body(Map.of(
                                                "code", "DOCUMENT_QUOTA_EXCEEDED",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(ProjectQuotaExceededException.class)
        public ResponseEntity<Map<String, Object>> handleProjectQuotaExceededException(
                        ProjectQuotaExceededException ex) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                                .body(Map.of(
                                                "code", "PROJECT_QUOTA_EXCEEDED",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
                ex.printStackTrace(); // Logs the stack trace to the console
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(Map.of(
                                                "code", "INTERNAL_SERVER_ERROR",
                                                "message",
                                                ex.getMessage() != null ? ex.getMessage() : "Unknown error occurred"));
        }

        @ExceptionHandler(MaxUploadSizeExceededException.class)
        public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceededException(
                        MaxUploadSizeExceededException ex) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                                .body(Map.of(
                                                "code", "DOCUMENT_QUOTA_EXCEEDED",
                                                "message", "Maximum document file size is 50MB."));
        }
}
