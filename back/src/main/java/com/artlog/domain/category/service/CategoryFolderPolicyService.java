package com.artlog.domain.category.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.category.entity.Category;
import com.artlog.domain.category.repository.CategoryRepository;
import com.artlog.domain.category.repository.UserInterestRepository;
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
    private final UserInterestRepository userInterestRepository;
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

    public List<Category> getUserInterestCategories(User user) {
        return userInterestRepository.findAllByUser_IdOrderByCategory_CreatedAtAsc(user.getId())
                .stream()
                .map(userInterest -> userInterest.getCategory())
                .toList();
    }

    public List<Long> getUserInterestCategoryIds(User user) {
        return getUserInterestCategories(user).stream()
                .map(Category::getId)
                .toList();
    }

    public Category getDefaultCategory(User user) {
        List<Category> categories = getUserInterestCategories(user);

        return categories.stream()
                .filter(category -> DEFAULT_CATEGORY_NAME.equalsIgnoreCase(category.getName()))
                .findFirst()
                .or(() -> categories.stream().findFirst())
                .orElseThrow(() -> ArtlogException.badRequest("관심 카테고리를 먼저 등록해주세요."));
    }

    public Category resolveUserInterestCategory(User user, Long categoryId) {
        if (categoryId == null) {
            return getDefaultCategory(user);
        }

        return userInterestRepository.findByUser_IdAndCategory_Id(user.getId(), categoryId)
                .map(userInterest -> userInterest.getCategory())
                .orElseThrow(() -> ArtlogException.notFound("관심 카테고리에서만 접근할 수 있습니다."));
    }

    public void validateUserInterestCategory(User user, Category category) {
        if (category == null) {
            throw ArtlogException.notFound("관심 카테고리에서만 접근할 수 있습니다.");
        }

        userInterestRepository.findByUser_IdAndCategory_Id(user.getId(), category.getId())
                .orElseThrow(() -> ArtlogException.notFound("관심 카테고리에서만 접근할 수 있습니다."));
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
