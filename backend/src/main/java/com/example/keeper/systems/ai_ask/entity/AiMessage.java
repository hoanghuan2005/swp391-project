package com.example.keeper.systems.ai_ask.entity;

import com.example.keeper.systems.ai_ask.enums.MessageRole;
import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "ai_messages")

@Getter
@Setter
@Builder

@NoArgsConstructor
@AllArgsConstructor
public class AiMessage extends BaseEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private AiConversation conversation;

    @Enumerated(EnumType.STRING)
    private MessageRole role;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Integer tokenCount;
}