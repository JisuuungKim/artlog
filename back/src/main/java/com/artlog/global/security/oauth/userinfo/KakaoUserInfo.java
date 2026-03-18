package com.artlog.global.security.oauth.userinfo;

import java.util.Map;

@SuppressWarnings("unchecked")
public class KakaoUserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;
    private final String nameAttributeKey;

    public KakaoUserInfo(Map<String, Object> attributes, String nameAttributeKey) {
        this.attributes = attributes;
        this.nameAttributeKey = nameAttributeKey == null || nameAttributeKey.isBlank() ? "id" : nameAttributeKey;
    }

    @Override
    public String getProvider() {
        return "KAKAO";
    }

    @Override
    public String getSocialId() {
        return String.valueOf(attributes.get("id"));
    }

    @Override
    public String getEmail() {
        Object kakaoAccount = attributes.get("kakao_account");
        if (!(kakaoAccount instanceof Map<?, ?> accountMap)) {
            return null;
        }
        Object email = ((Map<String, Object>) accountMap).get("email");
        return email == null ? null : String.valueOf(email);
    }

    @Override
    public String getNameAttributeKey() {
        return nameAttributeKey;
    }
}
