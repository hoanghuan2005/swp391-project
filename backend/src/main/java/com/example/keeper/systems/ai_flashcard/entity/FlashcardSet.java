package com.example.keeper.systems.ai_flashcard.entity;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.document.entity.Document;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter 
@Entity
@Table(name = "flashcard_sets")
public class FlashcardSet extends BaseEntity {

    private String title;

    @Column(columnDefinition = "TEXT")
    private String sourceText;

    @Column(name = "status")
    private String status = "DRAFT"; // DRAFT or PUBLISHED

    @Column(name = "visibility")
    private String visibility = "PRIVATE"; // PRIVATE or PUBLIC

    @Column(name = "course_id")
    private java.util.UUID courseId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;


    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;
}