package com.example.keeper.systems.document.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentQuotaResponse {

    private String subscriptionTier;
    private long uploadsToday;
    private long dailyUploadLimit;
    private long totalDocuments;
    private long totalDocumentLimit;
    private long maxFileSizeBytes;
}
