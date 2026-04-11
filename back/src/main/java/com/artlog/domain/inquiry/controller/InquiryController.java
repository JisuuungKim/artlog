package com.artlog.domain.inquiry.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.inquiry.dto.InquiryRequest;
import com.artlog.domain.inquiry.service.InquiryService;
import com.artlog.domain.user.entity.User;
import com.artlog.global.security.AuthenticatedUserResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submitInquiry(
            @AuthenticationPrincipal Object principal,
            @RequestBody InquiryRequest request
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        inquiryService.submitInquiry(user, request);
        return ResponseEntity.ok(ApiResponse.noContent());
    }
}
