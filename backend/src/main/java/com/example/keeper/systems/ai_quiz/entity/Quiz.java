package com.example.keeper.systems.ai_quiz.entity;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "quizzes")
public class Quiz extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "status")
    private String status = "DRAFT"; // DRAFT or PUBLISHED

    @Column(name = "visibility")
    private String visibility = "PRIVATE"; // PRIVATE or PUBLIC


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions = new ArrayList<>();
}
