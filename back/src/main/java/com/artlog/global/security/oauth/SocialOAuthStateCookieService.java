package com.artlog.global.security.oauth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Component
public class SocialOAuthStateCookieService {

    private static final Duration MAX_AGE = Duration.ofMinutes(5);

    public void addStateCookie(
            SocialOAuthProvider provider,
            HttpServletRequest request,
            HttpServletResponse response,
            String state
    ) {
        ResponseCookie cookie = ResponseCookie.from(cookieName(provider), state)
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(MAX_AGE)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public Optional<String> extractState(SocialOAuthProvider provider, HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return Optional.empty();
        }

        return Arrays.stream(cookies)
                .filter(cookie -> cookieName(provider).equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .filter(value -> !value.isBlank());
    }

    public void clearStateCookie(
            SocialOAuthProvider provider,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        ResponseCookie expiredCookie = ResponseCookie.from(cookieName(provider), "")
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
    }

    private String cookieName(SocialOAuthProvider provider) {
        return "oauth_state_" + provider.registrationId();
    }
}
