package com.example.keeper.systems.course.repository;

import com.example.keeper.systems.course.entity.CourseChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseChatMessageRepository extends JpaRepository<CourseChatMessage, UUID> {
    List<CourseChatMessage> findByCourseIdOrderByCreatedAtAsc(UUID courseId);
}
