package com.artlog.domain.note.entity;

import com.artlog.global.entity.BaseTimeEntity;
import com.artlog.global.type.FeedbackCardContent;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

@Entity
@Table(name = "feedback_card")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class FeedbackCard extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    /**
     * 피드백 카드 내용 (JSONB) — {title: String, content: List<String>} 형식
     */
    @Type(JsonType.class)
    @Column(name = "content", nullable = false, columnDefinition = "jsonb")
    private FeedbackCardContent content;
}
