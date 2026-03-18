package com.artlog.global.security.oauth.userinfo;

import java.util.Map;

public class GoogleUserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;
    private final String nameAttributeKey;

    public GoogleUserInfo(Map<String, Object> attributes, String nameAttributeKey) {
        this.attributes = attributes;
        this.nameAttributeKey = nameAttributeKey == null || nameAttributeKey.isBlank() ? "sub" : nameAttributeKey;
    }

    @Override
    public String getProvider() {
        return "GOOGLE";
    }

    @Override
    public String getSocialId() {
        return String.valueOf(attributes.get("sub"));
    }

    @Override
    public String getEmail() {
        Object email = attributes.get("email");
        return email == null ? null : String.valueOf(email);
    }

    @Override
    public String getNameAttributeKey() {
        return nameAttributeKey;
    }
}
