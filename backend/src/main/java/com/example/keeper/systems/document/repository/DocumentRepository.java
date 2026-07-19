package com.example.keeper.systems.document.repository;

import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.AiParseStatus;
import com.example.keeper.systems.document.enums.Visibility;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Page<Document> findByCourseId(UUID courseId, Pageable pageable);

    List<Document> findByUploadedById(UUID uploadedById);

    List<Document> findByUploadedByIdOrderByCreatedAtDesc(UUID uploadedById, Pageable pageable);

    long countByUploadedById(UUID uploadedById);

    long countByUploadedByIdAndVisibility(UUID uploadedById, Visibility visibility);

    @Query("select coalesce(sum(d.fileSize), 0) from Document d where d.uploadedBy.id = :uploadedById")
    Long sumFileSizeByUploadedById(@Param("uploadedById") UUID uploadedById);

    @Query("select coalesce(sum(d.viewCount), 0) from Document d where d.course.id = :courseId")
    long sumViewCountByCourseId(@Param("courseId") UUID courseId);

    long countByVisibility(Visibility visibility);

    long countByAiParseStatus(AiParseStatus aiParseStatus);

    long countByUploadedByIdAndCloudinaryPublicIdIsNotNullAndCreatedAtBetween(
            UUID uploadedById,
            LocalDateTime start,
            LocalDateTime end);

    @Query("select d from Document d order by d.downloadCount desc")
    List<Document> findTopByDownloadCount(Pageable pageable);

    @Query("select distinct d from Document d join d.tags t where lower(t.name) in :tagNames order by d.downloadCount desc")
    List<Document> findByTagNames(@Param("tagNames") List<String> tagNames, Pageable pageable);

    @Query("""
            select distinct d from Document d
            left join d.course c
            left join c.major m
            left join m.school s
            left join d.tags t
            left join d.category cat
            left join d.uploadedBy u
            left join u.profile p
            where d.visibility = :visibility
              and (
                lower(d.title) like lower(concat('%', :keyword, '%'))
                or lower(cast(d.description as String)) like lower(concat('%', :keyword, '%'))
                or lower(d.originalFileName) like lower(concat('%', :keyword, '%'))
                or lower(c.code) like lower(concat('%', :keyword, '%'))
                or lower(c.name) like lower(concat('%', :keyword, '%'))
                or lower(cast(c.description as String)) like lower(concat('%', :keyword, '%'))
                or lower(m.code) like lower(concat('%', :keyword, '%'))
                or lower(m.name) like lower(concat('%', :keyword, '%'))
                or lower(s.code) like lower(concat('%', :keyword, '%'))
                or lower(s.name) like lower(concat('%', :keyword, '%'))
                or lower(t.name) like lower(concat('%', :keyword, '%'))
                or lower(cat.code) like lower(concat('%', :keyword, '%'))
                or lower(cat.name) like lower(concat('%', :keyword, '%'))
                or lower(cast(cat.description as String)) like lower(concat('%', :keyword, '%'))
                or lower(p.schoolCode) like lower(concat('%', :keyword, '%'))
                or lower(p.schoolName) like lower(concat('%', :keyword, '%'))
              )
            order by d.downloadCount desc, d.createdAt desc, d.id
            """)
    List<Document> searchPublicByMetadata(
            @Param("visibility") Visibility visibility,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("select d from Document d where d.visibility = com.example.keeper.systems.document.enums.Visibility.PUBLIC order by d.downloadCount desc, d.viewCount desc")
    List<Document> findTopPublicDocuments(Pageable pageable);

    @Query("""
            select distinct d from Document d
            left join d.course c
            left join c.major m
            left join m.school s
            left join d.tags t
            where d.visibility = com.example.keeper.systems.document.enums.Visibility.PUBLIC
              and (
                (:schoolName is not null and :schoolName != '' and (lower(s.name) = lower(:schoolName) or lower(s.code) = lower(:schoolName) or lower(c.name) like lower(concat('%', :schoolName, '%'))))
                or (:majorName is not null and :majorName != '' and (lower(m.name) = lower(:majorName) or lower(m.code) = lower(:majorName) or lower(c.name) like lower(concat('%', :majorName, '%'))))
                or (lower(t.name) in :languageNames)
              )
            order by d.downloadCount desc, d.viewCount desc
            """)
    List<Document> findRecommendedDocuments(
            @Param("schoolName") String schoolName,
            @Param("majorName") String majorName,
            @Param("languageNames") List<String> languageNames,
            Pageable pageable
    );
}
