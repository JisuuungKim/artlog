package com.artlog.domain.category.service;

import com.artlog.domain.category.dto.CategoryResponse.CategorySummary;
import com.artlog.domain.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategorySummary> getCategories() {
        return categoryRepository.findAllByOrderByCreatedAtAsc()
                .stream()
                .map(CategorySummary::from)
                .toList();
    }
}
