package com.example.keeper.systems.document.service.storage;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FileUploadResult {

    private final String publicId;
    private final String secureUrl;
    private final String resourceType;
    private final String originalFileName;
    private final String mimeType;
}
