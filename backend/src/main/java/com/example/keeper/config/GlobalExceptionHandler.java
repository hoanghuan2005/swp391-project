package com.example.keeper.config;

import com.example.keeper.systems.ai_usage.exception.AiQuotaExceededException;
import com.example.keeper.systems.document.exception.DocumentQuotaExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AiQuotaExceededException.class)
    public ResponseEntity<Map<String, Object>> handleAiQuotaExceededException(AiQuotaExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of(
                        "code", "AI_QUOTA_EXCEEDED",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(DocumentQuotaExceededException.class)
    public ResponseEntity<Map<String, Object>> handleDocumentQuotaExceededException(DocumentQuotaExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of(
                        "code", "DOCUMENT_QUOTA_EXCEEDED",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of(
                        "code", "DOCUMENT_QUOTA_EXCEEDED",
                        "message", "Maximum document file size is 50MB."
                ));
    }
}
