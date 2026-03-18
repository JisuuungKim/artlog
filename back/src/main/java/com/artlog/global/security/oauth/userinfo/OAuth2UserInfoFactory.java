package com.artlog.global.security.oauth.userinfo;

import com.artlog.common.exception.ArtlogException;

import java.util.Locale;
import java.util.Map;

public final class OAuth2UserInfoFactory {

    private OAuth2UserInfoFactory() {
    }

    public static OAuth2UserInfo of(
            String registrationId,
            Map<String, Object> attributes,
            String nameAttributeKey
    ) {
        String normalizedRegistrationId = registrationId.toUpperCase(Locale.ROOT);

        return switch (normalizedRegistrationId) {
            case "GOOGLE" -> new GoogleUserInfo(attributes, nameAttributeKey);
            case "KAKAO" -> new KakaoUserInfo(attributes, nameAttributeKey);
            case "APPLE" -> new AppleUserInfo(attributes, nameAttributeKey);
            default -> throw ArtlogException.badRequest("지원하지 않는 OAuth provider 입니다: " + registrationId);
        };
    }
}
