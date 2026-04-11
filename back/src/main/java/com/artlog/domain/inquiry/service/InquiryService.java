package com.artlog.domain.inquiry.service;

import com.artlog.domain.inquiry.dto.InquiryRequest;
import com.artlog.domain.inquiry.entity.Inquiry;
import com.artlog.domain.inquiry.repository.InquiryRepository;
import com.artlog.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;

    @Transactional
    public void submitInquiry(User user, InquiryRequest request) {
        Inquiry inquiry = Inquiry.builder()
                .user(user)
                .title("1:1 문의")
                .content(request.content())
                .answerEmail(user.getEmail())
                .build();
        inquiryRepository.save(inquiry);
    }
}
