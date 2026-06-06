package com.example.keeper.systems.document.repository;

import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.Visibility;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Page<Document> findByCourseId(UUID courseId, Pageable pageable);

    List<Document> findByUploadedById(UUID uploadedById);

    long countByUploadedById(UUID uploadedById);

    @Query("select d from Document d order by d.downloadCount desc")
    List<Document> findTopByDownloadCount(Pageable pageable);

    @Query("select distinct d from Document d join d.tags t where lower(t.name) in :tagNames order by d.downloadCount desc")
    List<Document> findByTagNames(@Param("tagNames") List<String> tagNames, Pageable pageable);

    @Query("""
            select distinct d from Document d
            left join d.course c
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
}
