package com.artlog.domain.notification.repository;

import com.artlog.domain.notification.entity.Notification;
import com.artlog.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserAndCreatedAtAfterOrderByCreatedAtDesc(User user, OffsetDateTime after);
}
