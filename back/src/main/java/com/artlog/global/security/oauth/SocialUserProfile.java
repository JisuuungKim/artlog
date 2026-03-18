package com.artlog.global.security.oauth;

public record SocialUserProfile(
        String provider,
        String providerId,
        String email,
        String name
) {
}
