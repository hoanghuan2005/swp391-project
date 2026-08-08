package com.example.keeper.systems.auth.entity;

import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class SubscriptionPlan extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "price_vnd", nullable = false)
    private Long priceVnd;

    @Column(name = "max_file_size_bytes", nullable = false)
    private Long maxFileSizeBytes;

    @Column(name = "total_storage_bytes", nullable = false)
    private Long totalStorageBytes;

    @Column(name = "daily_upload_limit", nullable = false)
    private Long dailyUploadLimit;

    @Column(name = "total_document_limit", nullable = false)
    private Long totalDocumentLimit;

    @Builder.Default
    @Column(name = "daily_ai_limit", nullable = false)
    private Long dailyAiLimit = 10L;

    @Builder.Default
    @Column(name = "max_flashcards_per_generation", nullable = false)
    private Integer maxFlashcardsPerGeneration = 10;

    @Builder.Default
    @Column(name = "max_quiz_questions_per_generation", nullable = false)
    private Integer maxQuizQuestionsPerGeneration = 10;

    @Builder.Default
    @Column(name = "max_owned_projects", nullable = false)
    private Integer maxOwnedProjects = 3;

    @Builder.Default
    @Column(name = "max_joined_projects", nullable = false)
    private Integer maxJoinedProjects = 5;

    @Builder.Default
    @Column(name = "max_selected_docs", nullable = false)
    private Integer maxSelectedDocs = 2;

    @Builder.Default
    @Column(name = "max_personal_docs")
    private Integer maxPersonalDocs = 2;

    @Builder.Default
    @Column(name = "max_workspace_docs")
    private Integer maxWorkspaceDocs = 10;

    @Builder.Default
    @Column(name = "max_ai_context_chunks")
    private Integer maxAiContextChunks = 4;

    @Builder.Default
    @Column(name = "max_chunk_chars")
    private Integer maxChunkChars = 400;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private boolean isActive = true;

    public boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }
}
