package com.example.keeper.systems.document.repository;

import com.example.keeper.systems.document.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
}