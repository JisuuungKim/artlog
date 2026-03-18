package com.artlog.domain.user.dto;

import com.artlog.domain.user.entity.User;

public record UserMeResponse(
        Long id,
        String provider,
        String socialId,
        String email,
        Integer remainingCount,
        Boolean hideIphoneUploadGuide,
        Boolean hideMobileDataGuide
) {
    public static UserMeResponse from(User user) {
        return new UserMeResponse(
                user.getId(),
                user.getProvider(),
                user.getSocialId(),
                user.getEmail(),
                user.getRemainingCount(),
                user.getHideIphoneUploadGuide(),
                user.getHideMobileDataGuide()
        );
    }
}
