package com.artlog.domain.notification.dto;

import com.artlog.domain.notification.entity.Notification;

import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        Boolean isRead,
        OffsetDateTime createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getIsRead(),
                notification.getCreatedAt()
        );
    }
}
