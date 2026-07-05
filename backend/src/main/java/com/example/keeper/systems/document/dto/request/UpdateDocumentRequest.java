package com.example.keeper.systems.document.dto.request;

import com.example.keeper.systems.document.enums.Visibility;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class UpdateDocumentRequest {
    private String description;
    private Visibility visibility;
    private UUID categoryId;
    private UUID courseId;
    private UUID majorId;
    private String courseCode;
    private String courseName;
    private List<String> tagNames;
}
