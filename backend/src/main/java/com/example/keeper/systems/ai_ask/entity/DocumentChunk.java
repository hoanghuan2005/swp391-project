package com.example.keeper.systems.ai_ask.entity;

import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.pgvector.PGvector;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "document_chunks")
public class DocumentChunk extends BaseEntity {

    private UUID documentId;

    private Integer chunkIndex;

    @Column(columnDefinition = "vector(1024)")
    private float[] embedding;

    private String content; // nội dung chunk gốc
}

