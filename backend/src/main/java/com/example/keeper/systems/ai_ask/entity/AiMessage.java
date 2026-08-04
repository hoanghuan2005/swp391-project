package com.example.keeper.systems.ai_ask.entity;

import com.example.keeper.systems.ai_ask.dto.response.AskAIResponse;
import com.example.keeper.systems.ai_ask.enums.MessageRole;
import com.example.keeper.systems.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "ai_messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMessage extends BaseEntity {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private AiConversation conversation;

    @Enumerated(EnumType.STRING)
    private MessageRole role;

    @Column(columnDefinition = "TEXT")
    private String content;

    @JsonIgnore
    @Column(name = "sources_json", columnDefinition = "TEXT")
    private String sourcesJson;

    private Integer tokenCount;

    @JsonProperty("sources")
    public List<AskAIResponse.SourceReference> getSources() {
        if (sourcesJson == null || sourcesJson.isBlank()) {
            return List.of();
        }
        try {
            return OBJECT_MAPPER.readValue(sourcesJson, new TypeReference<List<AskAIResponse.SourceReference>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}