package com.artlog.global.config;

import com.artlog.domain.category.entity.Category;
import com.artlog.domain.category.repository.CategoryRepository;
import com.artlog.domain.folder.entity.Folder;
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
    private static final String DEFAULT_FOLDER_NAME = "전체노트";
    private static final String DEFAULT_CATEGORY_NAME = "보컬";

    private final CategoryRepository categoryRepository;
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

        Category fallbackCategory = categoryRepository
                .findFirstByNameIgnoreCaseOrderByCreatedAtAsc(DEFAULT_CATEGORY_NAME)
                .or(() -> categoryRepository.findAllByOrderByCreatedAtAsc().stream().findFirst())
                .orElse(null);

        if (fallbackCategory == null) {
            return;
        }

        folderRepository.findAllByCategoryIsNull()
                .forEach(folder -> folder.assignCategory(fallbackCategory));

        userSongRepository.findAllByCategoryIsNull()
                .forEach(song -> song.assignCategory(fallbackCategory));

        List<Category> categories = categoryRepository.findAllByOrderByCreatedAtAsc();
        for (User user : userRepository.findAllByIsDeletedFalseOrderByIdAsc()) {
            for (Category category : categories) {
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
}
