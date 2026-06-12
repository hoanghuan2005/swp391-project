package com.example.keeper.systems.ai_usage.entity;


import com.example.keeper.systems.ai_usage.enums.AiUsageFeature;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ai_usage")
@Getter
@Setter
@NoArgsConstructor
public class AiUsage extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AiUsageFeature feature; // example: ASK_AI, QUIZ_GENERATION, FLASHCARD_GENERATION
}
