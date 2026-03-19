package com.artlog.global.config;

import com.artlog.domain.category.entity.Category;
import com.artlog.domain.category.repository.CategoryRepository;
import com.artlog.domain.category.service.CategoryFolderPolicyService;
import com.artlog.domain.folder.repository.FolderRepository;
import com.artlog.domain.song.repository.UserSongRepository;
import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CategorySeedConfig {

    private static final List<String> DEFAULT_CATEGORY_NAMES = List.of("보컬", "피아노", "연기");

    private final CategoryRepository categoryRepository;
    private final CategoryFolderPolicyService categoryFolderPolicyService;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final UserSongRepository userSongRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultCategories() {
        for (String categoryName : DEFAULT_CATEGORY_NAMES) {
            if (categoryRepository.existsByNameIgnoreCase(categoryName)) {
                continue;
            }

            categoryRepository.save(Category.builder()
                    .name(categoryName)
                    .isCustom(false)
                    .build());
        }

        Category fallbackCategory = categoryFolderPolicyService.getDefaultCategory();

        folderRepository.findAllByCategoryIsNull()
                .forEach(folder -> folder.assignCategory(fallbackCategory));

        userSongRepository.findAllByCategoryIsNull()
                .forEach(song -> song.assignCategory(fallbackCategory));

        for (User user : userRepository.findAllByIsDeletedFalseOrderByIdAsc()) {
            categoryFolderPolicyService.ensureDefaultFolders(user);
        }
    }
}
