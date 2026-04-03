package com.artlog.global.security.oauth;

import com.artlog.domain.category.service.CategoryFolderPolicyService;
import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SocialUserRegistrarTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryFolderPolicyService categoryFolderPolicyService;

    @InjectMocks
    private SocialUserRegistrar socialUserRegistrar;

    @Test
    void updatesExistingUserWhenProviderAndProviderIdMatch() {
        User existingUser = User.builder()
                .id(1L)
                .provider("GOOGLE")
                .socialId("google-123")
                .email("before@example.com")
                .name("Before")
                .lastResetDate(OffsetDateTime.now())
                .build();

        when(userRepository.findByProviderAndSocialId("GOOGLE", "google-123"))
                .thenReturn(Optional.of(existingUser));

        SocialUserLoginResult result = socialUserRegistrar.registerOrUpdate(
                new SocialUserProfile("GOOGLE", "google-123", "after@example.com", "After")
        );

        assertThat(result.newUser()).isFalse();
        assertThat(result.user().getEmail()).isEqualTo("after@example.com");
        assertThat(result.user().getName()).isEqualTo("After");
        verify(userRepository, never()).save(any());
    }

    @Test
    void linksExistingUserByEmailWhenProviderIdChanges() {
        User existingUser = User.builder()
                .id(2L)
                .provider("KAKAO")
                .socialId("kakao-old")
                .email("user@example.com")
                .name("Old Name")
                .lastResetDate(OffsetDateTime.now())
                .build();

        when(userRepository.findByProviderAndSocialId("GOOGLE", "google-999"))
                .thenReturn(Optional.empty());
        when(userRepository.findFirstByEmailIgnoreCaseAndIsDeletedFalse("user@example.com"))
                .thenReturn(Optional.of(existingUser));

        SocialUserLoginResult result = socialUserRegistrar.registerOrUpdate(
                new SocialUserProfile("GOOGLE", "google-999", "user@example.com", "New Name")
        );

        assertThat(result.newUser()).isFalse();
        assertThat(result.user().getProvider()).isEqualTo("GOOGLE");
        assertThat(result.user().getSocialId()).isEqualTo("google-999");
        assertThat(result.user().getName()).isEqualTo("New Name");
    }

    @Test
    void createsUserWhenNoExistingUserMatches() {
        when(userRepository.findByProviderAndSocialId("GOOGLE", "google-new"))
                .thenReturn(Optional.empty());
        when(userRepository.findFirstByEmailIgnoreCaseAndIsDeletedFalse("new@example.com"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            return User.builder()
                    .id(3L)
                    .provider(user.getProvider())
                    .socialId(user.getSocialId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .lastResetDate(user.getLastResetDate())
                    .build();
        });

        SocialUserLoginResult result = socialUserRegistrar.registerOrUpdate(
                new SocialUserProfile("GOOGLE", "google-new", "new@example.com", "New User")
        );

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);

        assertThat(result.newUser()).isTrue();
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getProvider()).isEqualTo("GOOGLE");
        assertThat(captor.getValue().getSocialId()).isEqualTo("google-new");
        assertThat(captor.getValue().getEmail()).isEqualTo("new@example.com");
        assertThat(captor.getValue().getName()).isEqualTo("New User");
    }
}
