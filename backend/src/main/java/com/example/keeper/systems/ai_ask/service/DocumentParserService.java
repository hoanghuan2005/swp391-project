package com.example.keeper.systems.ai_ask.service;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentParserService {

    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingService embeddingService;

    private static final int CHUNK_SIZE = 1500; // max characters per chunk

    public void parseAndChunkDocument(MultipartFile file, UUID documentId) {
        String filename = file.getOriginalFilename();
        if (filename == null) return;
        
        filename = filename.toLowerCase();

        try (InputStream inputStream = file.getInputStream()) {
            String fullText = "";

            if (filename.endsWith(".pdf")) {
                fullText = extractPdfText(inputStream);
            } else if (filename.endsWith(".docx")) {
                fullText = extractDocxText(inputStream);
            } else {
                log.info("Unsupported file type for AI parsing: {}", filename);
                return;
            }

            if (fullText != null && !fullText.isBlank()) {
                chunkAndSaveText(fullText, documentId);
            } else {
                log.warn("Extracted text is empty for document: {}", documentId);
            }

        } catch (Exception e) {
            log.error("Failed to parse document for AI Ask. DocumentId: {}, Error: {}", documentId, e.getMessage(), e);
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
