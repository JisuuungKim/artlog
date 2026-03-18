package com.artlog.global.security.oauth.apple;

import java.util.List;

public record ApplePublicKeys(List<ApplePublicKey> keys) {

    public record ApplePublicKey(
            String kty,
            String kid,
            String use,
            String alg,
            String n,
            String e
    ) {
    }
}
