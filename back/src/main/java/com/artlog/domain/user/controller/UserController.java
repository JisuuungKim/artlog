package com.artlog.domain.user.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.user.dto.UserMeResponse;
import com.artlog.domain.user.entity.User;
import com.artlog.global.security.AuthenticatedUserResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserMeResponse>> me(
            @AuthenticationPrincipal Object principal
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        return ResponseEntity.ok(ApiResponse.ok(UserMeResponse.from(user)));
    }
}
