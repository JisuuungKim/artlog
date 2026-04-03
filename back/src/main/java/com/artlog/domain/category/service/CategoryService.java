package com.artlog.domain.category.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.category.dto.CategoryResponse;
import com.artlog.domain.category.dto.CategoryResponse.CategorySummary;
import com.artlog.domain.category.entity.Category;
import com.artlog.domain.category.entity.UserInterest;
import com.artlog.domain.category.repository.CategoryRepository;
import com.artlog.domain.category.repository.UserInterestRepository;
import com.artlog.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserInterestRepository userInterestRepository;
    private final CategoryFolderPolicyService categoryFolderPolicyService;

    public List<CategorySummary> getCategories(User user) {
        return categoryFolderPolicyService.getUserInterestCategories(user)
                .stream()
                .map(CategorySummary::from)
                .toList();
    }

    @Transactional
    public CategoryResponse.CategorySummary registerUserInterest(User user, String rawName) {
        String name = rawName == null ? "" : rawName.trim();

        if (name.isEmpty()) {
            throw ArtlogException.badRequest("카테고리 이름은 필수입니다.");
        }

        Category category = categoryRepository
                .findFirstByNameIgnoreCaseOrderByCreatedAtAsc(name)
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(name)
                        .isCustom(true)
                        .build()));

        if (!userInterestRepository.existsByUser_IdAndCategory_Id(user.getId(), category.getId())) {
            userInterestRepository.save(UserInterest.builder()
                    .user(user)
                    .category(category)
                    .build());
        }

        categoryFolderPolicyService.getOrCreateDefaultFolder(user, category);

        return CategorySummary.from(category);
    }
}
