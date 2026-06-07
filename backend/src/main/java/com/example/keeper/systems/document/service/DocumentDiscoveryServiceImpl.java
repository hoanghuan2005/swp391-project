package com.example.keeper.systems.document.service;

import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentDiscoveryServiceImpl implements DocumentDiscoveryService {

    private static final int MAX_KEYWORDS = 6;
    private static final int CANDIDATES_PER_KEYWORD = 20;
    private static final int RESULT_LIMIT = 5;

    private static final List<String> DOCUMENT_INTENT_PHRASES = List.of(
            "tim tai lieu",
            "co tai lieu nao",
            "tai lieu ve",
            "tai lieu cho",
            "can tai lieu",
            "need document",
            "need documents",
            "need material",
            "need materials",
            "find document",
            "find documents",
            "find material",
            "find materials",
            "materials about",
            "material about",
            "source for",
            "sources for",
            "document about",
            "documents about"
    );

    private static final Set<String> STOP_WORDS = Set.of(
            "tim", "tai", "lieu", "co", "nao", "ve", "cho", "mon", "toi", "can", "khong",
            "cua", "gi", "giup", "minh", "ban", "duoc",
            "find", "document", "documents", "material", "materials", "source", "sources",
            "about", "for", "please", "need", "some", "any", "the", "a", "an", "of", "on"
    );

    private final DocumentRepository documentRepository;

    @Override
    @Transactional(readOnly = true)
    public DiscoveryResult discover(String message) {
        boolean documentSearchIntent = hasDocumentSearchIntent(message);
        if (!documentSearchIntent) {
            return new DiscoveryResult(false, List.of());
        }

        List<String> keywords = extractKeywords(message);
        if (keywords.isEmpty()) {
            return new DiscoveryResult(true, List.of());
        }

        LinkedHashMap<UUID, Document> candidates = new LinkedHashMap<>();
        for (String keyword : keywords) {
            List<Document> matches = documentRepository.searchPublicByMetadata(
                    Visibility.PUBLIC,
                    keyword,
                    PageRequest.of(0, CANDIDATES_PER_KEYWORD)
            );
            for (Document document : matches) {
                candidates.putIfAbsent(document.getId(), document);
            }
        }

        List<Document> ranked = new ArrayList<>(candidates.values());
        ranked.sort(Comparator
                .comparingInt((Document document) -> countKeywordMatches(document, keywords))
                .reversed()
                .thenComparing(
                        Document::getDownloadCount,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
                .thenComparing(
                        Document::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
                .thenComparing(Document::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                .thenComparing(Document::getId));

        return new DiscoveryResult(true, ranked.stream().limit(RESULT_LIMIT).toList());
    }

    private boolean hasDocumentSearchIntent(String message) {
        String normalized = normalize(message);
        return DOCUMENT_INTENT_PHRASES.stream().anyMatch(normalized::contains);
    }

    private List<String> extractKeywords(String message) {
        if (message == null || message.isBlank()) {
            return List.of();
        }

        LinkedHashSet<String> keywords = new LinkedHashSet<>();
        String[] words = message.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+");
        for (String word : words) {
            String normalizedWord = normalize(word);
            if (normalizedWord.length() < 3 || STOP_WORDS.contains(normalizedWord)) {
                continue;
            }
            keywords.add(word);
            if (keywords.size() >= MAX_KEYWORDS) {
                break;
            }
        }
        return List.copyOf(keywords);
    }

    private int countKeywordMatches(Document document, List<String> keywords) {
        String searchableMetadata = normalize(buildSearchableMetadata(document));
        int matches = 0;
        for (String keyword : keywords) {
            if (searchableMetadata.contains(normalize(keyword))) {
                matches++;
            }
        }
        return matches;
    }

    private String buildSearchableMetadata(Document document) {
        StringBuilder metadata = new StringBuilder();
        append(metadata, document.getTitle());
        append(metadata, document.getDescription());
        append(metadata, document.getOriginalFileName());

        if (document.getCourse() != null) {
            append(metadata, document.getCourse().getCode());
            append(metadata, document.getCourse().getName());
            append(metadata, document.getCourse().getDescription());
        }
        if (document.getTags() != null) {
            document.getTags().forEach(tag -> append(metadata, tag.getName()));
        }
        if (document.getCategory() != null) {
            append(metadata, document.getCategory().getCode());
            append(metadata, document.getCategory().getName());
            append(metadata, document.getCategory().getDescription());
        }
        if (document.getUploadedBy() != null && document.getUploadedBy().getProfile() != null) {
            append(metadata, document.getUploadedBy().getProfile().getSchoolCode());
            append(metadata, document.getUploadedBy().getProfile().getSchoolName());
        }
        return metadata.toString();
    }

    private void append(StringBuilder target, String value) {
        if (value != null && !value.isBlank()) {
            target.append(' ').append(value);
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
