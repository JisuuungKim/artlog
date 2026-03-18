package com.artlog.global.security.oauth.apple;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ApplePublicKeyClient {

    private final RestClient restClient;
    private final String publicKeyUrl;

    public ApplePublicKeyClient(@Value("${app.apple.public-key-url}") String publicKeyUrl) {
        this.restClient = RestClient.create();
        this.publicKeyUrl = publicKeyUrl;
    }

    public ApplePublicKeys getPublicKeys() {
        ApplePublicKeys response = restClient.get()
                .uri(publicKeyUrl)
                .retrieve()
                .body(ApplePublicKeys.class);

        if (response == null || response.keys() == null || response.keys().isEmpty()) {
            throw new IllegalStateException("Apple 공개키를 조회할 수 없습니다.");
        }

        return response;
    }
}
