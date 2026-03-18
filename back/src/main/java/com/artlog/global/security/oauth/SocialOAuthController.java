package com.artlog.global.security.oauth;

import com.artlog.domain.auth.dto.AuthResponse.TokenPairResponse;
import com.artlog.domain.auth.service.AuthService;
import com.artlog.domain.auth.service.RefreshTokenCookieService;
import com.artlog.domain.user.entity.User;
import com.artlog.global.security.SessionCookieService;
import com.artlog.global.security.oauth.apple.AppleIdentityTokenValidator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class SocialOAuthController {

    private static final String GOOGLE_AUTHORIZATION_URI = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USER_INFO_URI = "https://openidconnect.googleapis.com/v1/userinfo";

    private static final String KAKAO_AUTHORIZATION_URI = "https://kauth.kakao.com/oauth/authorize";
    private static final String KAKAO_TOKEN_URI = "https://kauth.kakao.com/oauth/token";
    private static final String KAKAO_USER_INFO_URI = "https://kapi.kakao.com/v2/user/me";

    private static final String APPLE_AUTHORIZATION_URI = "https://appleid.apple.com/auth/authorize";
    private static final String APPLE_TOKEN_URI = "https://appleid.apple.com/auth/token";

    private final SocialUserRegistrar socialUserRegistrar;
    private final AuthService authService;
    private final RefreshTokenCookieService refreshTokenCookieService;
    private final SocialOAuthStateCookieService socialOAuthStateCookieService;
    private final SessionCookieService sessionCookieService;
    private final AppleIdentityTokenValidator appleIdentityTokenValidator;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.builder().build();

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    @Value("${GOOGLE_CLIENT_SECRET:}")
    private String googleClientSecret;

    @Value("${KAKAO_CLIENT_ID:}")
    private String kakaoClientId;

    @Value("${KAKAO_CLIENT_SECRET:}")
    private String kakaoClientSecret;

    @Value("${APPLE_CLIENT_ID:}")
    private String appleClientId;

    @Value("${APPLE_CLIENT_SECRET:}")
    private String appleClientSecret;

    @Value("${app.oauth2.authorized-redirect-uri}")
    private String authorizedRedirectUri;

    @Value("${app.oauth2.failure-redirect-uri}")
    private String failureRedirectUri;

    @GetMapping("/oauth2/authorization/{provider}")
    public void authorize(
            @PathVariable String provider,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        try {
            SocialOAuthProvider socialOAuthProvider = SocialOAuthProvider.from(provider);
            validateProviderConfigured(socialOAuthProvider);

            String state = UUID.randomUUID().toString();
            socialOAuthStateCookieService.addStateCookie(socialOAuthProvider, request, response, state);
            response.sendRedirect(buildAuthorizationUrl(socialOAuthProvider, request, state));
        } catch (Exception exception) {
            log.error("OAuth authorization failed for provider={}", provider, exception);
            response.sendRedirect(buildFailureUrl(provider + "-oauth-not-configured"));
        }
    }

    @GetMapping("/login/oauth2/code/{provider}")
    public void callbackGet(
            @PathVariable String provider,
            String code,
            String state,
            String error,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        handleCallback(provider, code, state, error, null, request, response);
    }

    @PostMapping(path = "/login/oauth2/code/apple", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public void callbackApplePost(
            String code,
            String state,
            String error,
            String user,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        handleCallback(SocialOAuthProvider.APPLE.registrationId(), code, state, error, user, request, response);
    }

    private void handleCallback(
            String provider,
            String code,
            String state,
            String error,
            String rawUserPayload,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        SocialOAuthProvider socialOAuthProvider = SocialOAuthProvider.from(provider);

        if (error != null && !error.isBlank()) {
            clearAuthCookies(socialOAuthProvider, request, response);
            response.sendRedirect(buildFailureUrl(error));
            return;
        }

        String expectedState = socialOAuthStateCookieService.extractState(socialOAuthProvider, request).orElse(null);
        if (code == null || code.isBlank() || expectedState == null || !expectedState.equals(state)) {
            clearAuthCookies(socialOAuthProvider, request, response);
            response.sendRedirect(buildFailureUrl("invalid-oauth-state"));
            return;
        }

        try {
            SocialUserProfile userProfile = fetchUserProfile(socialOAuthProvider, request, code, rawUserPayload);
            SocialUserLoginResult loginResult = socialUserRegistrar.registerOrUpdate(userProfile);

            User user = loginResult.user();
            TokenPairResponse tokenPair = authService.issueTokenPair(user);
            refreshTokenCookieService.addRefreshTokenCookie(response, tokenPair.refreshToken());
            clearAuthCookies(socialOAuthProvider, request, response);

            String targetUrl = UriComponentsBuilder.fromUriString(authorizedRedirectUri)
                    .queryParam("accessToken", tokenPair.accessToken())
                    .queryParam("provider", user.getProvider())
                    .queryParam("isNewUser", loginResult.newUser())
                    .build(true)
                    .toUriString();

            response.sendRedirect(targetUrl);
        } catch (Exception exception) {
            log.error("OAuth callback failed for provider={}", socialOAuthProvider, exception);
            clearAuthCookies(socialOAuthProvider, request, response);
            response.sendRedirect(buildFailureUrl(socialOAuthProvider.registrationId() + "-oauth-failed"));
        }
    }

    private String buildAuthorizationUrl(
            SocialOAuthProvider provider,
            HttpServletRequest request,
            String state
    ) {
        return switch (provider) {
            case GOOGLE -> UriComponentsBuilder.fromUriString(GOOGLE_AUTHORIZATION_URI)
                    .queryParam("client_id", googleClientId)
                    .queryParam("redirect_uri", buildRedirectUri(request, provider))
                    .queryParam("response_type", "code")
                    .queryParam("scope", "openid profile email")
                    .queryParam("state", state)
                    .build()
                    .encode()
                    .toUriString();
            case KAKAO -> UriComponentsBuilder.fromUriString(KAKAO_AUTHORIZATION_URI)
                    .queryParam("client_id", kakaoClientId)
                    .queryParam("redirect_uri", buildRedirectUri(request, provider))
                    .queryParam("response_type", "code")
                    .queryParam("scope", "profile_nickname account_email")
                    .queryParam("state", state)
                    .build()
                    .encode()
                    .toUriString();
            case APPLE -> UriComponentsBuilder.fromUriString(APPLE_AUTHORIZATION_URI)
                    .queryParam("client_id", appleClientId)
                    .queryParam("redirect_uri", buildRedirectUri(request, provider))
                    .queryParam("response_type", "code")
                    .queryParam("response_mode", "form_post")
                    .queryParam("scope", "name email")
                    .queryParam("state", state)
                    .build()
                    .encode()
                    .toUriString();
        };
    }

    private SocialUserProfile fetchUserProfile(
            SocialOAuthProvider provider,
            HttpServletRequest request,
            String code,
            String rawUserPayload
    ) {
        OAuthTokenResponse tokenResponse = exchangeCode(provider, request, code);

        return switch (provider) {
            case GOOGLE -> toGoogleProfile(fetchJsonUserInfo(GOOGLE_USER_INFO_URI, tokenResponse.accessToken()));
            case KAKAO -> toKakaoProfile(fetchJsonUserInfo(KAKAO_USER_INFO_URI, tokenResponse.accessToken()));
            case APPLE -> toAppleProfile(tokenResponse.idToken(), rawUserPayload);
        };
    }

    private OAuthTokenResponse exchangeCode(
            SocialOAuthProvider provider,
            HttpServletRequest request,
            String code
    ) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("code", code);
        formData.add("client_id", clientId(provider));
        formData.add("client_secret", clientSecret(provider));
        formData.add("redirect_uri", buildRedirectUri(request, provider));
        formData.add("grant_type", "authorization_code");

        return restClient.method(HttpMethod.POST)
                .uri(tokenUri(provider))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .body(OAuthTokenResponse.class);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchJsonUserInfo(String uri, String accessToken) {
        return restClient.get()
                .uri(uri)
                .headers(headers -> headers.setBearerAuth(accessToken))
                .retrieve()
                .body(Map.class);
    }

    private SocialUserProfile toGoogleProfile(Map<String, Object> attributes) {
        return new SocialUserProfile(
                SocialOAuthProvider.GOOGLE.name(),
                stringValue(attributes.get("sub")),
                stringValue(attributes.get("email")),
                firstNonBlank(
                        stringValue(attributes.get("name")),
                        stringValue(attributes.get("given_name"))
                )
        );
    }

    private SocialUserProfile toKakaoProfile(Map<String, Object> attributes) {
        Map<String, Object> account = nestedMap(attributes, "kakao_account");
        Map<String, Object> profile = nestedMap(account, "profile");

        return new SocialUserProfile(
                SocialOAuthProvider.KAKAO.name(),
                stringValue(attributes.get("id")),
                stringValue(account.get("email")),
                stringValue(profile.get("nickname"))
        );
    }

    private SocialUserProfile toAppleProfile(String idToken, String rawUserPayload) {
        Claims claims = appleIdentityTokenValidator.validate(idToken);
        Map<String, Object> appleUser = parseAppleUserPayload(rawUserPayload);
        Map<String, Object> appleName = nestedMap(appleUser, "name");

        return new SocialUserProfile(
                SocialOAuthProvider.APPLE.name(),
                claims.getSubject(),
                firstNonBlank(claims.get("email", String.class), stringValue(appleUser.get("email"))),
                firstNonBlank(
                        joinName(
                                stringValue(appleName.get("firstName")),
                                stringValue(appleName.get("lastName"))
                        ),
                        joinName(
                                stringValue(appleName.get("lastName")),
                                stringValue(appleName.get("firstName"))
                        )
                )
        );
    }

    private Map<String, Object> parseAppleUserPayload(String rawUserPayload) {
        if (rawUserPayload == null || rawUserPayload.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(rawUserPayload, objectMapper.getTypeFactory()
                    .constructMapType(HashMap.class, String.class, Object.class));
        } catch (Exception exception) {
            log.warn("Failed to parse Apple user payload", exception);
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> nestedMap(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        if (value instanceof Map<?, ?> mapValue) {
            return (Map<String, Object>) mapValue;
        }
        return Map.of();
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isBlank() ? null : text;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String joinName(String first, String second) {
        String left = first == null ? "" : first.trim();
        String right = second == null ? "" : second.trim();

        if (left.isBlank()) {
            return right.isBlank() ? null : right;
        }
        if (right.isBlank()) {
            return left;
        }
        return left + " " + right;
    }

    private String buildRedirectUri(HttpServletRequest request, SocialOAuthProvider provider) {
        return UriComponentsBuilder.fromHttpUrl(request.getRequestURL().toString())
                .replacePath("/login/oauth2/code/" + provider.registrationId())
                .replaceQuery(null)
                .build(true)
                .toUriString();
    }

    private String buildFailureUrl(String error) {
        return UriComponentsBuilder.fromUriString(failureRedirectUri)
                .queryParam("error", error)
                .build(true)
                .toUriString();
    }

    private void clearAuthCookies(
            SocialOAuthProvider provider,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        socialOAuthStateCookieService.clearStateCookie(provider, request, response);
        sessionCookieService.expireSessionCookie(request, response);
    }

    private String clientId(SocialOAuthProvider provider) {
        return switch (provider) {
            case GOOGLE -> googleClientId;
            case KAKAO -> kakaoClientId;
            case APPLE -> appleClientId;
        };
    }

    private String clientSecret(SocialOAuthProvider provider) {
        return switch (provider) {
            case GOOGLE -> googleClientSecret;
            case KAKAO -> kakaoClientSecret;
            case APPLE -> appleClientSecret;
        };
    }

    private String tokenUri(SocialOAuthProvider provider) {
        return switch (provider) {
            case GOOGLE -> GOOGLE_TOKEN_URI;
            case KAKAO -> KAKAO_TOKEN_URI;
            case APPLE -> APPLE_TOKEN_URI;
        };
    }

    private void validateProviderConfigured(SocialOAuthProvider provider) {
        if (clientId(provider).isBlank()) {
            throw new IllegalStateException(provider.name() + " client id 가 비어 있습니다.");
        }

        if (clientSecret(provider).isBlank()) {
            throw new IllegalStateException(provider.name() + " client secret 이 비어 있습니다.");
        }
    }

    private record OAuthTokenResponse(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("refresh_token") String refreshToken,
            @JsonProperty("id_token") String idToken,
            @JsonProperty("token_type") String tokenType,
            @JsonProperty("expires_in") Long expiresIn,
            String scope
    ) {
    }
}
