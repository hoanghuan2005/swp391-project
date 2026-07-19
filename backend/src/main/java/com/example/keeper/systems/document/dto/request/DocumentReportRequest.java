package com.example.keeper.systems.document.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentReportRequest {
    @NotBlank(message = "Reason is required")
    private String reason;
}
