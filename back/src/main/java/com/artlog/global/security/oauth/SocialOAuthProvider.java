package com.artlog.global.security.oauth;

import com.artlog.common.exception.ArtlogException;

import java.util.Locale;

public enum SocialOAuthProvider {
    GOOGLE,
    KAKAO,
    APPLE;

    public static SocialOAuthProvider from(String value) {
        try {
            return SocialOAuthProvider.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw ArtlogException.badRequest("지원하지 않는 OAuth provider 입니다: " + value);
        }
    }

    public String registrationId() {
        return name().toLowerCase(Locale.ROOT);
    }
}
