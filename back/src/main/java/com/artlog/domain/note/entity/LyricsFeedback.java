package com.artlog.domain.note.entity;

import com.artlog.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lyrics_feedback")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LyricsFeedback extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Column(name = "line_text", columnDefinition = "TEXT")
    private String lineText;

    @Column(name = "feedback_title", length = 255)
    private String feedbackTitle;

    @Column(name = "problem_text", columnDefinition = "TEXT")
    private String problemText;

    @Column(name = "solution_text", columnDefinition = "TEXT")
    private String solutionText;
}
