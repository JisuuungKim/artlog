package com.artlog.global.security.jwt;

import com.artlog.domain.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_PROVIDER = "provider";
    private static final String CLAIM_SOCIAL_ID = "socialId";

    private static final String ACCESS_TOKEN = "access";
    private static final String REFRESH_TOKEN = "refresh";

    private final SecretKey secretKey;
    private final long accessTokenExpirationSeconds;
    private final long refreshTokenExpirationSeconds;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration-seconds}") long accessTokenExpirationSeconds,
            @Value("${jwt.refresh-token-expiration-seconds}") long refreshTokenExpirationSeconds
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationSeconds = accessTokenExpirationSeconds;
        this.refreshTokenExpirationSeconds = refreshTokenExpirationSeconds;
    }

    public String createAccessToken(User user) {
        return createToken(user, ACCESS_TOKEN, accessTokenExpirationSeconds);
    }

    public String createRefreshToken(User user) {
        return createToken(user, REFRESH_TOKEN, refreshTokenExpirationSeconds);
    }

    public boolean validateAccessToken(String token) {
        return validateToken(token, ACCESS_TOKEN);
    }

    public boolean validateRefreshToken(String token) {
        return validateToken(token, REFRESH_TOKEN);
    }

    public long getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationSeconds;
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationSeconds;
    }

    public Long getUserId(String token) {
        Object userId = getClaims(token).get(CLAIM_USER_ID);
        if (userId instanceof Integer integerValue) {
            return integerValue.longValue();
        }
        if (userId instanceof Long longValue) {
            return longValue;
        }
        return Long.parseLong(String.valueOf(userId));
    }

    private String createToken(User user, String tokenType, long expirationSeconds) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(expirationSeconds);

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim(CLAIM_TYPE, tokenType)
                .claim(CLAIM_USER_ID, user.getId())
                .claim(CLAIM_PROVIDER, user.getProvider())
                .claim(CLAIM_SOCIAL_ID, user.getSocialId())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(secretKey)
                .compact();
    }

    private boolean validateToken(String token, String expectedType) {
        try {
            Claims claims = getClaims(token);
            return expectedType.equals(claims.get(CLAIM_TYPE, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
