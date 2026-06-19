package com.example.keeper.systems.document.dto.request;

import lombok.Data;

@Data
public class DocumentReviewRequest {
    private Integer rating;
    private String comment;
}
