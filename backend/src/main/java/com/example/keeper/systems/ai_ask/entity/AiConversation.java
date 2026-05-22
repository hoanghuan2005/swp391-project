package com.example.keeper.systems.ai_ask.entity;

import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
public class AiConversation extends BaseEntity {

    private UUID userId;

    private UUID documentId;

    @Column(columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "LONGTEXT")
    private String answer;
}
