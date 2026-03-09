package com.artlog.global.type;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * JSONB 필드 공통 타입: {title, content} 구조를 가진 항목
 * 사용처: Note.keyFeedback, Note.practiceGuide, Note.nextAssignment
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TitleContentItem {

    private String title;
    private String content;
}
