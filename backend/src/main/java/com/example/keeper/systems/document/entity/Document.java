package com.example.keeper.systems.document.entity;

import com.example.keeper.systems.base.BaseEntity;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.subject.entity.Subject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility;

//    @Enumerated(EnumType.STRING)
//    @Column(name = "upload_status", nullable = false)
//    private UploadStatus uploadStatus;

    @Column(name = "download_count")
    private Integer downloadCount = 0;

//    @ManyToOne
//    @JoinColumn(name = "uploaded_by", nullable = false)
//    private User uploadedBy;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Subject subject;
}
