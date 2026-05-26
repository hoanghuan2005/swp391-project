package com.example.keeper.systems.ai_quiz.entity;

import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.ai_quiz.converter.StringListConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "questions")
public class Question extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> options;

    @Column(name = "correct_answer", nullable = false)
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String explanation;
}
