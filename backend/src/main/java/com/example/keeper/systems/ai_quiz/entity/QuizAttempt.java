package com.example.keeper.systems.ai_quiz.entity;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.ai_quiz.converter.QuizAttemptDetailsConverter;
import com.example.keeper.systems.ai_quiz.dto.response.QuizQuestionAttempt;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "quiz_attempts")
public class QuizAttempt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "score", nullable = false)
    private int score;

    @Column(name = "total_questions", nullable = false)
    private int totalQuestions;

    @Column(name = "elapsed_seconds", nullable = false)
    private int elapsedSeconds;

    @Convert(converter = QuizAttemptDetailsConverter.class)
    @Column(name = "details", columnDefinition = "TEXT")
    private List<QuizQuestionAttempt> details;
}
