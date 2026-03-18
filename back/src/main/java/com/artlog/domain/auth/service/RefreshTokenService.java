package com.artlog.domain.auth.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String KEY_PREFIX = "auth:refresh:";

    private final StringRedisTemplate stringRedisTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    public void save(Long userId, String refreshToken) {
        stringRedisTemplate.opsForValue().set(
                buildKey(userId),
                refreshToken,
                Duration.ofSeconds(jwtTokenProvider.getRefreshTokenExpirationSeconds())
        );
    }

    public void validateRotationTarget(String refreshToken) {
        if (!jwtTokenProvider.validateRefreshToken(refreshToken)) {
            throw ArtlogException.unauthorized("유효하지 않은 refresh token 입니다.");
        }

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        String savedToken = stringRedisTemplate.opsForValue().get(buildKey(userId));

        if (savedToken == null || !savedToken.equals(refreshToken)) {
            throw ArtlogException.unauthorized("이미 만료되었거나 재사용된 refresh token 입니다.");
        }
    }

    public void rotate(String oldRefreshToken, String newRefreshToken) {
        Long userId = jwtTokenProvider.getUserId(oldRefreshToken);
        save(userId, newRefreshToken);
    }

    public void deleteByUserId(Long userId) {
        stringRedisTemplate.delete(buildKey(userId));
    }

    public void deleteByRefreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateRefreshToken(refreshToken)) {
            return;
        }
        deleteByUserId(jwtTokenProvider.getUserId(refreshToken));
    }

    private String buildKey(Long userId) {
        return KEY_PREFIX + userId;
    }
}
