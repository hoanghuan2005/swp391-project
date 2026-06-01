package com.example.keeper.systems.notification.service;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.service.AuthService;
import com.example.keeper.systems.notification.dto.NotificationResponse;
import com.example.keeper.systems.notification.entity.Notification;
import com.example.keeper.systems.notification.enums.NotificationType;
import com.example.keeper.systems.notification.enums.ReferenceType;
import com.example.keeper.systems.notification.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    @Override
    public void createNotification(
            User recipient,
            User sender,
            NotificationType type,
            String title,
            String message,
            UUID referenceId,
            ReferenceType referenceType
    ) {

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Override
    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {

        User currentUser = authService.getCurrentUser();

        return notificationRepository
                .findByRecipient_IdOrderByCreatedAtDesc(
                        currentUser.getId(),
                        pageable
                )
                .map(this::mapToResponse);
    }

    @Override
    public Long getUnreadCount() {

        User currentUser = authService.getCurrentUser();

        return notificationRepository
                .countByRecipient_IdAndIsReadFalse(
                        currentUser.getId()
                );
    }

    @Override
    public void markAsRead(UUID notificationId) {

        User currentUser = authService.getCurrentUser();

        Notification notification =
                notificationRepository.findByIdAndRecipient_Id(
                                notificationId,
                                currentUser.getId()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException("Notification not found"));

        notification.setIsRead(true);

        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead() {

        User currentUser = authService.getCurrentUser();

        notificationRepository
                .findByRecipient_IdOrderByCreatedAtDesc(
                        currentUser.getId(),
                        Pageable.unpaged()
                )
                .forEach(notification -> notification.setIsRead(true));

        notificationRepository.flush();
    }

    private NotificationResponse mapToResponse(Notification notification) {

        return NotificationResponse.builder()
                .id(notification.getId())
                .senderId(
                        notification.getSender() != null
                                ? notification.getSender().getId()
                                : null
                )
                .senderName(
                        notification.getSender() != null
                                ? notification.getSender().getUsername()
                                : "System"
                )
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}