package com.example.keeper.systems.ai_ask.service;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.document.repository.DocumentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.extractor.XSLFExtractor;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentParserService {

    public String parseTextOnly(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "";
        }
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            return "";
        }
        filename = filename.toLowerCase(Locale.ROOT);
        try (InputStream inputStream = file.getInputStream()) {
            if (filename.endsWith(".pdf")) {
                return extractPdfText(file.getBytes());
            } else if (filename.endsWith(".docx")) {
                return extractDocxText(inputStream);
            } else if (filename.endsWith(".pptx")) {
                return extractPptxText(inputStream);
            } else {
                return new String(file.getBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.error("Failed to parse file text on-the-fly: {}", e.getMessage(), e);
            return "";
        }
    }

    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingService embeddingService;
    private final DocumentRepository documentRepository;

    private static final int CHUNK_SIZE = 1500; // max characters per chunk
    private static final int MAX_EXTRACTED_CHARACTERS = 150_000;
    private static final int MAX_CHUNKS = 100;

    public boolean parseAndChunkDocument(byte[] fileBytes, String originalFilename, String contentType, UUID documentId) {
        if (fileBytes == null || fileBytes.length == 0) {
            log.warn("Cannot parse empty file content for document: {}", documentId);
            return false;
        }

        String filename = originalFilename;
        if (filename == null || filename.isBlank()) {
            log.warn("Cannot parse document without original filename. DocumentId: {}, contentType: {}",
                    documentId,
                    contentType);
            return false;
        }

        filename = filename.toLowerCase(Locale.ROOT);

        try (InputStream inputStream = new ByteArrayInputStream(fileBytes)) {
            String fullText = "";
            boolean isPdf = filename.endsWith(".pdf");

            if (isPdf) {
                fullText = extractPdfText(fileBytes);
            } else if (filename.endsWith(".docx")) {
                fullText = extractDocxText(inputStream);
            } else if (filename.endsWith(".pptx")) {
                fullText = extractPptxText(inputStream);
            } else {
                log.info("Unsupported file type for AI parsing: {}, contentType: {}", filename, contentType);
                return false;
            }

            if (fullText != null && !fullText.isBlank()) {
                if (fullText.length() > MAX_EXTRACTED_CHARACTERS) {
                    log.warn("Truncating extracted text for document {} from {} to {} characters",
                            documentId,
                            fullText.length(),
                            MAX_EXTRACTED_CHARACTERS);
                    fullText = fullText.substring(0, MAX_EXTRACTED_CHARACTERS);
                }
                chunkAndSaveText(fullText, documentId);
                return true;
            } else {
                if (isPdf) {
                    log.warn("PDFBox extracted blank text for document: {}, filename: {}, contentType: {}. "
                                    + "This PDF is likely scanned/image-only and is unsupported without OCR.",
                            documentId,
                            filename,
                            contentType);
                    return false;
                }
                log.warn("Extracted text is blank for document: {}, filename: {}, contentType: {}",
                        documentId,
                        filename,
                        contentType);
                return false;
            }

        } catch (Exception e) {
            log.error("Failed to parse document for AI Ask. DocumentId: {}, Error: {}", documentId, e.getMessage(), e);
            return false;
        }
    }

    private String extractPdfText(byte[] fileBytes) throws Exception {
        try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(fileBytes)) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        }
    }

    private String extractDocxText(InputStream inputStream) throws Exception {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractPptxText(InputStream inputStream) throws Exception {
        try (XMLSlideShow slideShow = new XMLSlideShow(inputStream);
             XSLFExtractor extractor = new XSLFExtractor(slideShow)) {
            return extractor.getText();
        }
    }

    private void chunkAndSaveText(String fullText, UUID documentId) {
        // Simple chunking strategy based on character count and words
        String[] words = fullText.split("\\s+");
        
        StringBuilder currentChunk = new StringBuilder();
        List<String> chunks = new ArrayList<>();
        
        for (String word : words) {
            if (currentChunk.length() + word.length() + 1 > CHUNK_SIZE) {
                // save current chunk
                chunks.add(currentChunk.toString());
                currentChunk = new StringBuilder();
            }
            currentChunk.append(word).append(" ");
        }
        
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString());
        }

        if (chunks.size() > MAX_CHUNKS) {
            log.warn("Limiting document {} from {} to {} chunks", documentId, chunks.size(), MAX_CHUNKS);
            chunks = new ArrayList<>(chunks.subList(0, MAX_CHUNKS));
        }

        int chunkIndex = 0;
        for (String chunkText : chunks) {

            float[] embedding =
                    embeddingService.embed(chunkText);

            DocumentChunk chunk = new DocumentChunk();

            chunk.setDocumentId(documentId);
            chunk.setChunkIndex(chunkIndex++);
            chunk.setContent(chunkText.trim());
            chunk.setEmbedding(embedding);

            documentChunkRepository.save(chunk);
        }

        log.info("Saved {} chunks for document {}", chunks.size(), documentId);
    }

    public void ensureChunksExist(UUID documentId) {
        List<DocumentChunk> existing = documentChunkRepository.findByDocumentId(documentId);
        if (!existing.isEmpty()) {
            return;
        }

        log.info("Document {} has 0 chunks. Attempting to parse and chunk on the fly.", documentId);

        com.example.keeper.systems.document.entity.Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.warn("Document {} not found in database", documentId);
            return;
        }

        String fileUrl = document.getFileUrl();
        if (fileUrl == null || fileUrl.isBlank()) {
            log.warn("Document {} has no file URL", documentId);
            return;
        }

        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            byte[] fileBytes = restTemplate.getForObject(fileUrl, byte[].class);
            if (fileBytes != null && fileBytes.length > 0) {
                String filename = document.getOriginalFileName();
                if (filename == null || filename.isBlank()) {
                    filename = document.getTitle();
                }
                if (filename == null || filename.isBlank()) {
                    filename = "document.pdf";
                }
                
                // Guess extension if missing
                if (!filename.contains(".")) {
                    if ("application/pdf".equalsIgnoreCase(document.getMimeType())) {
                        filename += ".pdf";
                    } else if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equalsIgnoreCase(document.getMimeType())) {
                        filename += ".docx";
                    } else if ("application/vnd.openxmlformats-officedocument.presentationml.presentation".equalsIgnoreCase(document.getMimeType())) {
                        filename += ".pptx";
                    }
                }
                
                boolean success = parseAndChunkDocument(
                        fileBytes,
                        filename,
                        document.getMimeType(),
                        document.getId()
                );
                
                if (success) {
                    document.setAiParseStatus(com.example.keeper.systems.document.enums.AiParseStatus.READY);
                    documentRepository.save(document);
                } else {
                    document.setAiParseStatus(com.example.keeper.systems.document.enums.AiParseStatus.FAILED);
                    documentRepository.save(document);
                }
                log.info("On-the-fly parsing result for document {}: {}", documentId, success);
            }
        } catch (Exception e) {
            log.error("Failed to parse document on the fly for document: {}, URL: {}", documentId, fileUrl, e);
        }
    }
}
