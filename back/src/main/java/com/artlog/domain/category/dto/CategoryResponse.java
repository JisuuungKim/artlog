package com.artlog.domain.category.dto;

import com.artlog.domain.category.entity.Category;

public class CategoryResponse {

    public record CategorySummary(
            Long id,
            String name,
            Boolean isCustom
    ) {
        public static CategorySummary from(Category category) {
            return new CategorySummary(
                    category.getId(),
                    category.getName(),
                    category.getIsCustom()
            );
        }
    }
}
