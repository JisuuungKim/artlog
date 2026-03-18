package com.artlog.global.security.oauth;

import com.artlog.domain.user.entity.User;

public record SocialUserLoginResult(
        User user,
        boolean newUser,
        String nameAttributeKey
) {
}
