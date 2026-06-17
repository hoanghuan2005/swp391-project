package com.example.keeper.systems.document.service;

import com.example.keeper.systems.document.dto.response.DocumentQuotaResponse;

public interface DocumentQuotaService {

    void validateUpload(String email, long fileSize);

    void validateDocumentCreation(String email);

    DocumentQuotaResponse getQuota(String email);
}
