package com.example.keeper.systems.course.entity;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.document.entity.Document;
import com.fasterxml.jackson.annotation.JsonIgnore;

import com.example.keeper.systems.major.entity.Major;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "courses", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"major_id", "code"})
})
public class Course extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne
    @JoinColumn(name = "major_id")
    private Major major;

    @OneToMany(mappedBy = "course")
    @JsonIgnore
    private List<Document> documents = new ArrayList<>();

    @Transient
    public int getDocumentCount() {
        return documents != null ? documents.size() : 0;
    }

    @Transient
    private int flashcardCount = 0;

    @Transient
    private Double averageRating = 0.0;

    @Transient
    private int reviewCount = 0;

    @Transient
    private int quizCount = 0;

    public int getFlashcardCount() {
        return flashcardCount;
    }

    public void setFlashcardCount(int flashcardCount) {
        this.flashcardCount = flashcardCount;
    }

    public int getQuizCount() {
        return quizCount;
    }

    public void setQuizCount(int quizCount) {
        this.quizCount = quizCount;
    }

    @ManyToMany(mappedBy = "followedCourses")
    @JsonIgnore
    private List<User> followers = new ArrayList<>();

    public Course(String code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }
}