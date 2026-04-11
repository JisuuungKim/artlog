package com.artlog.domain.user.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.user.dto.UserMeResponse;
import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import com.artlog.global.security.AuthenticatedUserResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    @Transactional
    public ResponseEntity<ApiResponse<UserMeResponse>> me(
            @AuthenticationPrincipal Object principal
    ) {
        User principalUser = AuthenticatedUserResolver.resolve(principal);
        User user = userRepository.findByIdAndIsDeletedFalse(principalUser.getId())
                .orElse(principalUser);
        user.refreshMonthlyLessonNoteQuota(OffsetDateTime.now());
        return ResponseEntity.ok(ApiResponse.ok(UserMeResponse.from(user)));
    }
}
