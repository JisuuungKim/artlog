package com.artlog.domain.notification.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.notification.dto.NotificationResponse;
import com.artlog.domain.notification.entity.Notification;
import com.artlog.domain.notification.repository.NotificationRepository;
import com.artlog.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getRecentNotifications(User user) {
        OffsetDateTime sevenDaysAgo = OffsetDateTime.now().minusDays(7);
        return notificationRepository
                .findByUserAndCreatedAtAfterOrderByCreatedAtDesc(user, sevenDaysAgo)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public void markAsRead(User user, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ArtlogException.notFound("알림을 찾을 수 없습니다."));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw ArtlogException.forbidden("접근 권한이 없습니다.");
        }

        notification.markAsRead();
    }
}
