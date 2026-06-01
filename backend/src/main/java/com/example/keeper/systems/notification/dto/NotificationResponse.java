package com.example.keeper.systems.notification.dto;

import com.example.keeper.systems.notification.enums.NotificationType;
import com.example.keeper.systems.notification.enums.ReferenceType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {

    private UUID id;

    private UUID senderId;

    private String senderName;

    private String senderAvatar;

    private String title;

    private String message;

    private NotificationType type;

    private UUID referenceId;

    private ReferenceType referenceType;

    private Boolean isRead;

    private LocalDateTime createdAt;
}