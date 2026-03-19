package com.artlog.global.security.oauth;

import com.artlog.domain.category.entity.Category;
import com.artlog.domain.category.repository.CategoryRepository;
import com.artlog.domain.folder.entity.Folder;
import com.artlog.domain.folder.repository.FolderRepository;
import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
public class SocialUserRegistrar {

    private static final String DEFAULT_FOLDER_NAME = "전체노트";

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;

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
                    ensureDefaultFolder(user);
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
                    ensureDefaultFolder(newUser);
                    return new SocialUserLoginResult(newUser, true);
                });
    }

    private java.util.Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return java.util.Optional.empty();
        }
        return userRepository.findFirstByEmailIgnoreCaseAndIsDeletedFalse(email);
    }

    private void ensureDefaultFolder(User user) {
        for (Category category : categoryRepository.findAllByOrderByCreatedAtAsc()) {
            if (folderRepository.findFirstByUserIdAndCategory_IdAndNameOrderByCreatedAtAsc(
                    user.getId(),
                    category.getId(),
                    DEFAULT_FOLDER_NAME
            ).isPresent()) {
                continue;
            }

            folderRepository.save(Folder.builder()
                    .name(DEFAULT_FOLDER_NAME)
                    .user(user)
                    .isSystem(false)
                    .category(category)
                    .build());
        }
    }
}
