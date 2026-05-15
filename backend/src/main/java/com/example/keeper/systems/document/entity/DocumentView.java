package com.example.keeper.systems.document.entity;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "document_views", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "document_id" }))
public class DocumentView extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "last_viewed_at", nullable = false)
    private LocalDateTime lastViewedAt;

    public DocumentView(User user, Document document, LocalDateTime lastViewedAt) {
        this.user = user;
        this.document = document;
        this.lastViewedAt = lastViewedAt;
    }
}
