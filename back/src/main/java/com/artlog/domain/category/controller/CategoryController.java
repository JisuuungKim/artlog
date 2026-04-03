package com.artlog.domain.category.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.category.dto.CategoryRequest.RegisterUserInterestRequest;
import com.artlog.domain.category.dto.CategoryResponse.CategorySummary;
import com.artlog.domain.category.service.CategoryService;
import com.artlog.domain.user.entity.User;
import com.artlog.global.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategorySummary>>> getCategories(
            @AuthenticationPrincipal Object principal
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategories(user)));
    }

    @PostMapping("/interests")
    public ResponseEntity<ApiResponse<CategorySummary>> registerUserInterest(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody RegisterUserInterestRequest request
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        CategorySummary category = categoryService.registerUserInterest(user, request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(category));
    }
}
