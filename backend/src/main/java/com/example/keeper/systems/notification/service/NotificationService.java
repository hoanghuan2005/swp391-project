package com.example.keeper.systems.notification.service;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.notification.dto.NotificationResponse;
import com.example.keeper.systems.notification.enums.NotificationType;
import com.example.keeper.systems.notification.enums.ReferenceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    void createNotification(
            User recipient,
            User sender,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            ReferenceType referenceType
    );

    Page<NotificationResponse> getMyNotifications(Pageable pageable);

    Long getUnreadCount();

    void markAsRead(UUID notificationId);

    void markAllAsRead();
}