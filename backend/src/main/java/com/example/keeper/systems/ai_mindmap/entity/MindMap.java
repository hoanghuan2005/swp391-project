package com.example.keeper.systems.ai_mindmap.entity;

import com.example.keeper.systems.ai_mindmap.enums.MindMapStatus;
import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "mind_maps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MindMap extends BaseEntity {

    @Column(nullable = false)
    private UUID documentId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    private MindMapStatus status;
}
