package com.artlog.domain.category.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.category.entity.Category;
import com.artlog.domain.category.repository.CategoryRepository;
import com.artlog.domain.folder.entity.Folder;
import com.artlog.domain.folder.repository.FolderRepository;
import com.artlog.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryFolderPolicyService {

    public static final String DEFAULT_CATEGORY_NAME = "보컬";
    public static final String DEFAULT_FOLDER_NAME = "전체노트";

    private final CategoryRepository categoryRepository;
    private final FolderRepository folderRepository;

    public List<Category> getCategories() {
        return categoryRepository.findAllByOrderByCreatedAtAsc();
    }

    public Category getDefaultCategory() {
        return categoryRepository.findFirstByNameIgnoreCaseOrderByCreatedAtAsc(DEFAULT_CATEGORY_NAME)
                .or(() -> categoryRepository.findAllByOrderByCreatedAtAsc().stream().findFirst())
                .orElseThrow(() -> ArtlogException.notFound("카테고리를 찾을 수 없습니다."));
    }

    public Category resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return getDefaultCategory();
        }

        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> ArtlogException.notFound("카테고리를 찾을 수 없습니다."));
    }

    @Transactional
    public void ensureDefaultFolders(User user) {
        for (Category category : getCategories()) {
            getOrCreateDefaultFolder(user, category);
        }
    }

    @Transactional
    public Folder getOrCreateDefaultFolder(User user, Category category) {
        return findDefaultFolder(user.getId(), category.getId())
                .orElseGet(() -> createDefaultFolder(user, category));
    }

    @Transactional
    public Folder createDefaultFolder(User user, Category category) {
        return folderRepository.save(Folder.builder()
                .name(DEFAULT_FOLDER_NAME)
                .user(user)
                .isSystem(false)
                .category(category)
                .build());
    }

    @Transactional
    public Folder resolveFolder(User user, Long folderId, Category category) {
        if (folderId == null) {
            return getOrCreateDefaultFolder(user, category);
        }

        return folderRepository.findByIdAndUser_IdAndCategory_Id(folderId, user.getId(), category.getId())
                .orElseGet(() -> getOrCreateDefaultFolder(user, category));
    }

    public Optional<Folder> findDefaultFolder(Long userId, Long categoryId) {
        return folderRepository.findFirstByUserIdAndCategory_IdAndNameOrderByCreatedAtAsc(
                userId,
                categoryId,
                DEFAULT_FOLDER_NAME
        ).or(() -> folderRepository.findFirstByUserIdAndCategory_IdOrderByCreatedAtAsc(userId, categoryId));
    }
}
