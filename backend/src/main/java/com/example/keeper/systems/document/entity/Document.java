package com.example.keeper.systems.document.entity;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.category.entity.Category;
import com.example.keeper.systems.document.enums.AiParseStatus;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.course.entity.Course;
import com.example.keeper.systems.tag.entity.Tag;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "documents")
public class Document extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "file_public_id")
    private String cloudinaryPublicId;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "file_type")
    private String mimeType;

    @Column(name = "file_resource_type")
    private String resourceType;

    @Column(name = "preview_url")
    private String previewUrl;

    @Column(name = "download_url")
    private String downloadUrl;

    @Column(name = "original_file_name")
    private String originalFileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_parse_status", nullable = false)
    private AiParseStatus aiParseStatus = AiParseStatus.PENDING;

    // @Enumerated(EnumType.STRING)
    // @Column(name = "upload_status", nullable = false)
    // private UploadStatus uploadStatus;

    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @ManyToOne
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = true)
    private Course course;

    @ManyToMany
    @JoinTable(name = "document_tags", joinColumns = @JoinColumn(name = "document_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
}
