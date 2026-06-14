package com.example.keeper.systems.ai_flashcard.entity;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.document.entity.Document;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

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

    // ==========================================
    // ĐOẠN THÊM MỚI CHO TÍNH NĂNG THẢ TIM (FAVORITE)
    // ==========================================
    @ManyToMany
    @JoinTable(
            name = "flashcard_set_favorites", // Tên bảng trung gian sẽ được tự động tạo trong database
            joinColumns = @JoinColumn(name = "flashcard_set_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> favoritedByUsers = new HashSet<>();
}