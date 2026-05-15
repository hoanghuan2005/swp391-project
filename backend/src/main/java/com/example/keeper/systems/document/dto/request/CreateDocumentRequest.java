package com.example.keeper.systems.document.dto.request;

import com.example.keeper.systems.document.enums.Visibility;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class CreateDocumentRequest {

    private String title;

    private String description;

    private String fileUrl;

    private String thumbnailUrl;

    private String fileType;

    private Long fileSize;

    private Visibility visibility;

    private UUID uploadedById;

    private UUID subjectId;

    private String subjectCode;

    private String subjectName;

    private List<String> tagNames;
}