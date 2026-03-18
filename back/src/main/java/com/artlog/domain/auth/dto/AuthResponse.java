package com.artlog.domain.auth.dto;

public class AuthResponse {

    public record AccessTokenResponse(
            String accessToken,
            long expiresIn
    ) {
    }

    public record TokenPairResponse(
            String accessToken,
            String refreshToken,
            long accessTokenExpiresIn
    ) {
    }
}
