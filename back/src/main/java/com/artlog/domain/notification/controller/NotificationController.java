package com.artlog.domain.notification.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.notification.dto.NotificationResponse;
import com.artlog.domain.notification.service.NotificationService;
import com.artlog.domain.user.entity.User;
import com.artlog.global.security.AuthenticatedUserResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @AuthenticationPrincipal Object principal
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        List<NotificationResponse> notifications = notificationService.getRecentNotifications(user);
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long notificationId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        notificationService.markAsRead(user, notificationId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }
}
