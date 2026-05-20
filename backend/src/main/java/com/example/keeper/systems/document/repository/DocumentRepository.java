package com.example.keeper.systems.document.repository;

import com.example.keeper.systems.document.entity.Document;

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

	@Query("select d from Document d order by d.downloadCount desc")
	List<Document> findTopByDownloadCount(Pageable pageable);

	@Query("select distinct d from Document d join d.tags t where lower(t.name) in :tagNames order by d.downloadCount desc")
	List<Document> findByTagNames(@Param("tagNames") List<String> tagNames, Pageable pageable);
}