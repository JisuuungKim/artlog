package com.artlog.domain.auth.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.auth.dto.AuthResponse.AccessTokenResponse;
import com.artlog.domain.auth.dto.AuthResponse.TokenPairResponse;
import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import com.artlog.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public TokenPairResponse issueTokenPair(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user);
        String refreshToken = jwtTokenProvider.createRefreshToken(user);
        refreshTokenService.save(user.getId(), refreshToken);

        return new TokenPairResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getAccessTokenExpirationSeconds()
        );
    }

    @Transactional
    public TokenPairResponse reissue(String refreshToken) {
        refreshTokenService.validateRotationTarget(refreshToken);

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> ArtlogException.unauthorized("사용자를 찾을 수 없습니다."));

        TokenPairResponse newPair = issueTokenPair(user);
        refreshTokenService.rotate(refreshToken, newPair.refreshToken());
        return newPair;
    }

    @Transactional(readOnly = true)
    public AccessTokenResponse toAccessTokenResponse(TokenPairResponse tokenPair) {
        return new AccessTokenResponse(tokenPair.accessToken(), tokenPair.accessTokenExpiresIn());
    }

    @Transactional
    public void logout(User user, String refreshToken) {
        if (user != null) {
            refreshTokenService.deleteByUserId(user.getId());
            return;
        }

        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.deleteByRefreshToken(refreshToken);
        }
    }
}
