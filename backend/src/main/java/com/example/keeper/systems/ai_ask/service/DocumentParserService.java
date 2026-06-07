package com.example.keeper.systems.ai_ask.service;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentParserService {

    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingService embeddingService;

    private static final int CHUNK_SIZE = 1500; // max characters per chunk

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
                fullText = extractPdfText(inputStream);
            } else if (filename.endsWith(".docx")) {
                fullText = extractDocxText(inputStream);
            } else if (filename.endsWith(".pptx")) {
                fullText = extractPptxText(inputStream);
            } else {
                log.info("Unsupported file type for AI parsing: {}, contentType: {}", filename, contentType);
                return false;
            }

            if (fullText != null && !fullText.isBlank()) {
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

    private String extractPdfText(InputStream inputStream) throws Exception {
        try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(
                new org.apache.pdfbox.io.RandomAccessReadBuffer(inputStream))) {
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
}
