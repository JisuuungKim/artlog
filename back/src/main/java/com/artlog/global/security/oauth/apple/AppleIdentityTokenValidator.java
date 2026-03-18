package com.artlog.global.security.oauth.apple;

import com.artlog.common.exception.ArtlogException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AppleIdentityTokenValidator {

    private final ApplePublicKeyClient applePublicKeyClient;
    private final ObjectMapper objectMapper;

    @Value("${app.apple.audience}")
    private String audience;

    @Value("${app.apple.issuer}")
    private String issuer;

    public Claims validate(String identityToken) {
        Map<String, String> header = parseHeader(identityToken);
        ApplePublicKeys.ApplePublicKey matchingKey = applePublicKeyClient.getPublicKeys().keys().stream()
                .filter(key -> key.kid().equals(header.get("kid")) && key.alg().equals(header.get("alg")))
                .findFirst()
                .orElseThrow(() -> ArtlogException.unauthorized("Apple 공개키를 찾을 수 없습니다."));

        Claims claims = Jwts.parser()
                .verifyWith((PublicKey) toPublicKey(matchingKey))
                .build()
                .parseSignedClaims(identityToken)
                .getPayload();

        if (!issuer.equals(claims.getIssuer())) {
            throw ArtlogException.unauthorized("Apple issuer 검증에 실패했습니다.");
        }
        if (!audience.equals(claims.getAudience())) {
            throw ArtlogException.unauthorized("Apple audience 검증에 실패했습니다.");
        }

        return claims;
    }

    private Map<String, String> parseHeader(String identityToken) {
        try {
            String[] parts = identityToken.split("\\.");
            if (parts.length < 2) {
                throw ArtlogException.unauthorized("유효하지 않은 Apple identity token 입니다.");
            }

            byte[] decoded = Decoders.BASE64URL.decode(parts[0]);
            return objectMapper.readValue(decoded, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw ArtlogException.unauthorized("Apple token header 파싱에 실패했습니다.");
        }
    }

    private PublicKey toPublicKey(ApplePublicKeys.ApplePublicKey applePublicKey) {
        try {
            BigInteger modulus = new BigInteger(1, Decoders.BASE64URL.decode(applePublicKey.n()));
            BigInteger exponent = new BigInteger(1, Decoders.BASE64URL.decode(applePublicKey.e()));
            RSAPublicKeySpec keySpec = new RSAPublicKeySpec(modulus, exponent);
            return KeyFactory.getInstance("RSA").generatePublic(keySpec);
        } catch (Exception e) {
            throw ArtlogException.unauthorized("Apple 공개키 변환에 실패했습니다.");
        }
    }
}
