package com.artlog.global.security.oauth.userinfo;

public interface OAuth2UserInfo {

    String getProvider();

    String getSocialId();

    String getEmail();

    String getNameAttributeKey();
}
