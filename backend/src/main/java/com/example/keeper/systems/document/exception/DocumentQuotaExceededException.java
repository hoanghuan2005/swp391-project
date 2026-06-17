package com.example.keeper.systems.document.exception;

public class DocumentQuotaExceededException extends RuntimeException {

    public DocumentQuotaExceededException(String message) {
        super(message);
    }
}
