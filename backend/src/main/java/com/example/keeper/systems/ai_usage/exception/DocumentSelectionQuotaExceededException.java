package com.example.keeper.systems.ai_usage.exception;

public class DocumentSelectionQuotaExceededException extends RuntimeException {
    public DocumentSelectionQuotaExceededException(String message) {
        super(message);
    }
}
