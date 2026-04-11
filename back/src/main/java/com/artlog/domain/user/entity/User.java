package com.artlog.domain.user.entity;

import com.artlog.domain.category.entity.UserInterest;
import com.artlog.domain.folder.entity.Folder;
import com.artlog.domain.inquiry.entity.Inquiry;
import com.artlog.domain.note.entity.Note;
import com.artlog.domain.notification.entity.Notification;
import com.artlog.domain.search.entity.SearchHistory;
import com.artlog.domain.song.entity.UserSong;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "\"user\"",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_provider_social_id",
                columnNames = {"provider", "social_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

    public static final int MONTHLY_LESSON_NOTE_LIMIT = 4;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "social_id", nullable = false, length = 255)
    private String socialId;

    @Column(name = "provider", nullable = false, length = 50)
    private String provider;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "remaining_count")
    @Builder.Default
    private Integer remainingCount = MONTHLY_LESSON_NOTE_LIMIT;

    /**
     * 이용권 초기화 기준일
     */
    @Column(name = "last_reset_date", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    @Builder.Default
    private OffsetDateTime lastResetDate = OffsetDateTime.now();

    @Column(name = "created_at", columnDefinition = "TIMESTAMP WITH TIME ZONE",
            updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * 아이폰 파일 업로드 안내 모달 다시보지않기
     */
    @Column(name = "hide_iphone_upload_guide")
    @Builder.Default
    private Boolean hideIphoneUploadGuide = false;

    /**
     * 모바일 데이터 사용 안내 모달 다시보지않기
     */
    @Column(name = "hide_mobile_data_guide")
    @Builder.Default
    private Boolean hideMobileDataGuide = false;

    // --- 연관관계 ---

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<TermsConsent> termsConsents = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserInterest> userInterests = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<Folder> folders = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserSong> userSongs = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<Note> notes = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<SearchHistory> searchHistories = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<Notification> notifications = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<Inquiry> inquiries = new ArrayList<>();

    // --- 비즈니스 메서드 ---

    public void softDelete() {
        this.isDeleted = true;
        this.updatedAt = OffsetDateTime.now();
    }

    public void decreaseRemainingCount() {
        if (this.remainingCount > 0) {
            this.remainingCount--;
        }
    }

    public void refreshMonthlyLessonNoteQuota(OffsetDateTime now) {
        if (this.remainingCount == null
                || this.lastResetDate == null
                || !this.lastResetDate.plusMonths(1).isAfter(now)) {
            this.remainingCount = MONTHLY_LESSON_NOTE_LIMIT;
            this.lastResetDate = now;
            this.updatedAt = now;
        }
    }

    public boolean hasRemainingLessonNoteQuota() {
        return this.remainingCount != null && this.remainingCount > 0;
    }

    public void upsertSocialProfile(String provider, String socialId, String email, String name) {
        this.provider = provider;
        this.socialId = socialId;
        this.email = email;
        this.name = name;
        this.isDeleted = false;
        this.updatedAt = OffsetDateTime.now();
    }

    public void hideIphoneUploadGuide() {
        this.hideIphoneUploadGuide = true;
        this.updatedAt = OffsetDateTime.now();
    }

    public void hideMobileDataGuide() {
        this.hideMobileDataGuide = true;
        this.updatedAt = OffsetDateTime.now();
    }
}
