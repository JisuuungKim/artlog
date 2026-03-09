package com.artlog.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "terms_consent")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TermsConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 약관 종류 (e.g. SERVICE, PRIVACY, MARKETING)
     */
    @Column(name = "term_type", nullable = false, length = 50)
    private String termType;

    @Column(name = "is_agreed", nullable = false)
    @Builder.Default
    private Boolean isAgreed = false;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP WITH TIME ZONE",
            updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
