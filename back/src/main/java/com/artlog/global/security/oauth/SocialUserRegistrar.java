package com.artlog.global.security.oauth;

import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import com.artlog.global.security.oauth.userinfo.OAuth2UserInfo;
import com.artlog.global.security.oauth.userinfo.OAuth2UserInfoFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SocialUserRegistrar {

    private final UserRepository userRepository;

    @Transactional
    public SocialUserLoginResult registerOrUpdate(
            String registrationId,
            Map<String, Object> attributes,
            String nameAttributeKey
    ) {
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.of(registrationId, attributes, nameAttributeKey);
        String provider = userInfo.getProvider();
        String socialId = userInfo.getSocialId();

        return userRepository.findBySocialIdAndProvider(socialId, provider)
                .map(user -> {
                    user.updateSocialProfile(userInfo.getEmail());
                    return new SocialUserLoginResult(user, false, userInfo.getNameAttributeKey());
                })
                .orElseGet(() -> {
                    User newUser = userRepository.save(User.builder()
                            .socialId(socialId)
                            .provider(provider)
                            .email(userInfo.getEmail())
                            .lastResetDate(OffsetDateTime.now())
                            .build());
                    return new SocialUserLoginResult(newUser, true, userInfo.getNameAttributeKey());
                });
    }
}
