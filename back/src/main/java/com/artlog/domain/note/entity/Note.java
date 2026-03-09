package com.artlog.domain.note.entity;

import com.artlog.global.type.TitleContentItem;
import com.artlog.domain.category.entity.Category;
import com.artlog.domain.folder.entity.Folder;
import com.artlog.domain.user.entity.User;
import com.artlog.global.entity.BaseTimeEntity;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "note")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Note extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** folder_id는 ON DELETE SET NULL → nullable FK */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    /** category_id는 ON DELETE SET NULL → nullable FK */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_type", nullable = false, length = 20)
    private NoteType noteType;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "recording_url", columnDefinition = "TEXT")
    private String recordingUrl;

    /** [{title, content}] 형식의 핵심 피드백 */
    @Type(JsonType.class)
    @Column(name = "key_feedback", columnDefinition = "jsonb")
    private List<TitleContentItem> keyFeedback;

    /** [{title, content}] 형식의 연습 가이드 */
    @Type(JsonType.class)
    @Column(name = "practice_guide", columnDefinition = "jsonb")
    private List<TitleContentItem> practiceGuide;

    /** [{title, content}] 형식의 다음 과제 */
    @Type(JsonType.class)
    @Column(name = "next_assignment", columnDefinition = "jsonb")
    private List<TitleContentItem> nextAssignment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private NoteStatus status;

    @Column(name = "start_time", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime startTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "condition_text", columnDefinition = "TEXT", nullable = true)
    private String conditionText;

    // --- 연관관계 ---

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<NoteSongTag> noteSongTags = new ArrayList<>();

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<FeedbackCard> feedbackCards = new ArrayList<>();

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    @Builder.Default
    private List<LyricsFeedback> lyricsFeedbacks = new ArrayList<>();

    // --- 비즈니스 메서드 ---

    public void rename(String title) {
        this.title = title;
    }

    public void moveToFolder(Folder folder) {
        this.folder = folder;
    }
}
