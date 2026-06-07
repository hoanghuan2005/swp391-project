package com.example.keeper.systems.ai_ask.entity;

import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ai_conversations")

@Getter
@Setter
@Builder

@NoArgsConstructor
@AllArgsConstructor
public class AiConversation extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    private String title;

    private String modelName;

    private UUID documentId;

    private UUID projectId;

    @Builder.Default
    @OneToMany(
            mappedBy = "conversation",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<AiMessage> messages = new ArrayList<>();
}
