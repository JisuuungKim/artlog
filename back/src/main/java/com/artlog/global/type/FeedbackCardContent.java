package com.artlog.global.type;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * FeedbackCard.content JSONB 타입
 * 포맷: {title: string, content: List&lt;String&gt;}
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackCardContent {

    private String title;
    private List<String> content;
}
