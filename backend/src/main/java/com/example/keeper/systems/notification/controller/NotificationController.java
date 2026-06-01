package com.example.keeper.systems.notification.controller;

import com.example.keeper.systems.notification.dto.NotificationResponse;
import com.example.keeper.systems.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Lấy danh sách notification của user hiện tại
     */
    @GetMapping
    public Page<NotificationResponse> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        Pageable pageable = PageRequest.of(page, size);

        return notificationService.getMyNotifications(pageable);
    }

    /**
     * Đếm notification chưa đọc
     */
    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {

        return Map.of(
                "count",
                notificationService.getUnreadCount()
        );
    }

    /**
     * Đánh dấu một notification đã đọc
     */
    @PutMapping("/{notificationId}/read")
    public Map<String, String> markAsRead(
            @PathVariable UUID notificationId
    ) {

        notificationService.markAsRead(notificationId);

        return Map.of(
                "message",
                "Notification marked as read"
        );
    }

    /**
     * Đánh dấu tất cả notification đã đọc
     */
    @PutMapping("/read-all")
    public Map<String, String> markAllAsRead() {

        notificationService.markAllAsRead();

        return Map.of(
                "message",
                "All notifications marked as read"
        );
    }
}