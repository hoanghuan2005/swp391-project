package com.example.keeper.systems.ai_flashcard.entity;

import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "flashcards")
public class Flashcard extends BaseEntity {

    private String term;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @ManyToOne
    @JoinColumn(name = "set_id")
    private FlashcardSet flashcardSet;
}