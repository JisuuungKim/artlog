package com.artlog.domain.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryRequest {

    public record RegisterUserInterestRequest(
            @NotBlank(message = "카테고리 이름은 필수입니다.")
            @Size(max = 100, message = "카테고리 이름은 100자 이하여야 합니다.")
            String name
    ) {
    }
}
