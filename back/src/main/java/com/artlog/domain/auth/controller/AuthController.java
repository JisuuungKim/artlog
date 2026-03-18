package com.artlog.domain.auth.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.auth.dto.AuthResponse.AccessTokenResponse;
import com.artlog.domain.auth.dto.AuthResponse.TokenPairResponse;
import com.artlog.domain.auth.service.AuthService;
import com.artlog.domain.auth.service.RefreshTokenCookieService;
import com.artlog.domain.user.entity.User;
import com.artlog.global.security.AuthenticatedUserResolver;
import com.artlog.global.security.SessionCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenCookieService refreshTokenCookieService;
    private final SessionCookieService sessionCookieService;

    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<AccessTokenResponse>> reissue(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = refreshTokenCookieService.extractRefreshToken(request)
                .orElseThrow(() -> ArtlogException.unauthorized("refresh token 쿠키가 없습니다."));

        TokenPairResponse tokenPair = authService.reissue(refreshToken);
        refreshTokenCookieService.addRefreshTokenCookie(response, tokenPair.refreshToken());

        return ResponseEntity.ok(ApiResponse.ok(authService.toAccessTokenResponse(tokenPair)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal Object principal,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        User user = principal == null ? null : AuthenticatedUserResolver.resolve(principal);
        String refreshToken = refreshTokenCookieService.extractRefreshToken(request).orElse(null);
        authService.logout(user, refreshToken);
        refreshTokenCookieService.clearRefreshTokenCookie(response);
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        sessionCookieService.expireSessionCookie(request, response);
        return ResponseEntity.ok(ApiResponse.noContent());
    }
}
