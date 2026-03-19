package com.artlog.domain.category.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.category.dto.CategoryResponse.CategorySummary;
import com.artlog.domain.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategorySummary>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategories()));
    }
}
