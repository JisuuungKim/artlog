package com.artlog.global.security.oauth;

import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
public class SocialUserRegistrar {

    private final UserRepository userRepository;

    @Transactional
    public SocialUserLoginResult registerOrUpdate(SocialUserProfile profile) {
        return userRepository.findByProviderAndSocialId(profile.provider(), profile.providerId())
                .or(() -> findByEmail(profile.email()))
                .map(user -> {
                    user.upsertSocialProfile(
                            profile.provider(),
                            profile.providerId(),
                            profile.email(),
                            profile.name()
                    );
                    return new SocialUserLoginResult(user, false);
                })
                .orElseGet(() -> {
                    User newUser = userRepository.save(User.builder()
                            .socialId(profile.providerId())
                            .provider(profile.provider())
                            .email(profile.email())
                            .name(profile.name())
                            .lastResetDate(OffsetDateTime.now())
                            .build());
                    return new SocialUserLoginResult(newUser, true);
                });
    }

    private java.util.Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return java.util.Optional.empty();
        }
        return userRepository.findFirstByEmailIgnoreCaseAndIsDeletedFalse(email);
    }
}
