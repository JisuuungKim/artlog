package com.artlog.global.security;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.user.entity.User;

public final class AuthenticatedUserResolver {

    private AuthenticatedUserResolver() {
    }

    public static User resolve(Object principal) {
        if (principal instanceof User user) {
            return user;
        }

        throw ArtlogException.unauthorized("인증이 필요합니다.");
    }
}
