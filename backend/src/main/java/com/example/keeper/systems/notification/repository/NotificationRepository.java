package com.example.keeper.systems.notification.repository;

import com.example.keeper.systems.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository
        extends JpaRepository<Notification, UUID> {

    Page<Notification> findByRecipient_IdOrderByCreatedAtDesc(
            UUID recipientId,
            Pageable pageable
    );

    Long countByRecipient_IdAndIsReadFalse(
            UUID recipientId
    );

    Optional<Notification> findByIdAndRecipient_Id(
            UUID notificationId,
            UUID recipientId
    );
}