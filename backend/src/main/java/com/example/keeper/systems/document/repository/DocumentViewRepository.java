package com.example.keeper.systems.document.repository;

import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.entity.DocumentView;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentViewRepository extends JpaRepository<DocumentView, UUID> {

    Optional<DocumentView> findByUserIdAndDocumentId(UUID userId, UUID documentId);

    @Query("select dv from DocumentView dv where dv.user.id = :userId order by dv.lastViewedAt desc")
    List<DocumentView> findRecentDocuments(@Param("userId") UUID userId, Pageable pageable);

    void deleteByDocumentId(UUID documentId);
}
