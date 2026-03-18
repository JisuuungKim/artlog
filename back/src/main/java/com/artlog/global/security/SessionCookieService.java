package com.artlog.global.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class SessionCookieService {

    public void expireSessionCookie(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie expiredCookie = ResponseCookie.from("JSESSIONID", "")
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
    }
}
