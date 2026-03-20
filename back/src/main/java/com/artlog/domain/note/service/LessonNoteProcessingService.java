package com.artlog.domain.note.service;

import com.artlog.domain.note.entity.FeedbackCard;
import com.artlog.domain.note.entity.FeedbackKeyword;
import com.artlog.domain.note.entity.LyricsFeedback;
import com.artlog.domain.note.entity.Note;
import com.artlog.domain.note.repository.NoteRepository;
import com.artlog.global.type.TitleContentItem;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonNoteProcessingService {

    private static final List<KeywordItem> DEFAULT_KEYWORDS = List.of(
            new KeywordItem("1", "발성"),
            new KeywordItem("2", "발음"),
            new KeywordItem("3", "음정 · 박자"),
            new KeywordItem("4", "감정 · 해석")
    );

    private final NoteRepository noteRepository;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.ai.base-url}")
    private String aiBaseUrl;

    public void process(Long noteId) {
        try {
            AiJobPayload payload = transactionTemplate.execute(status -> {
                Note note = noteRepository.findById(noteId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "노트를 찾을 수 없습니다."));

                return new AiJobPayload(
                        note.getId(),
                        note.getRecordingUrl(),
                        note.getNoteSongTags().stream().map(tag -> tag.getUserSong().getTitle()).toList()
                );
            });

            if (payload == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "노트를 찾을 수 없습니다.");
            }

            LessonNoteGenerateResponse response = requestLessonNote(payload);

            if (response == null || response.lessonNote() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 응답이 비어 있습니다.");
            }

            transactionTemplate.executeWithoutResult(status -> applyResponse(noteId, response.lessonNote()));
        } catch (Exception exception) {
            log.error("Lesson note AI processing failed. noteId={}", noteId, exception);
            transactionTemplate.executeWithoutResult(status -> markFailed(noteId));
        }
    }

    private LessonNoteGenerateResponse requestLessonNote(AiJobPayload payload) {
        Map<String, Object> requestBody = Map.of(
                "session_id", "note-" + payload.noteId(),
                "audio_path", payload.audioPath(),
                "song_title", payload.songTitles(),
                "keywords", DEFAULT_KEYWORDS.stream().map(keyword -> Map.of(
                        "feedback_keyword_id", keyword.feedbackKeywordId(),
                        "feedback_keyword_name", keyword.feedbackKeywordName()
                )).toList()
        );

        try {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(5000);
            requestFactory.setReadTimeout(300000);

            return RestClient.builder()
                    .baseUrl(aiBaseUrl)
                    .requestFactory(requestFactory)
                    .build()
                    .post()
                    .uri("/api/v1/lesson-notes/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(LessonNoteGenerateResponse.class);
        } catch (HttpStatusCodeException exception) {
            log.error(
                    "AI request failed. status={} body={}",
                    exception.getStatusCode(),
                    exception.getResponseBodyAsString()
            );
            throw exception;
        }
    }

    private void applyResponse(Long noteId, LessonNoteBody lessonNote) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "노트를 찾을 수 없습니다."));
        note.completeAnalysis(
                toTitleContents(lessonNote.keyFeedback()),
                toTitleContents(lessonNote.practiceGuide()),
                toAssignmentContents(lessonNote.nextAssignment())
        );

        replaceFeedbackKeywords(note, lessonNote.feedbackCards());
        replaceLyricsFeedbacks(note, lessonNote.lyricsFeedbacks());
    }

    private void markFailed(Long noteId) {
        noteRepository.findById(noteId).ifPresent(Note::markFailed);
    }

    private List<TitleContentItem> toTitleContents(List<TitleContentPayload> items) {
        if (items == null) {
            return List.of();
        }

        return items.stream()
                .map(item -> TitleContentItem.builder()
                        .title(item.title())
                        .content(item.content())
                        .build())
                .toList();
    }

    private List<TitleContentItem> toAssignmentContents(List<String> items) {
        if (items == null) {
            return List.of();
        }

        return items.stream()
                .map(item -> TitleContentItem.builder().content(item).build())
                .toList();
    }

    private void replaceFeedbackKeywords(Note note, List<FeedbackCardPayload> cards) {
        note.getFeedbackKeywords().clear();

        if (cards == null || cards.isEmpty()) {
            return;
        }

        Map<String, FeedbackKeyword> keywordMap = new LinkedHashMap<>();

        for (FeedbackCardPayload card : cards) {
            FeedbackKeyword keyword = keywordMap.computeIfAbsent(card.feedbackKeywordId(), id -> {
                FeedbackKeyword created = FeedbackKeyword.builder()
                        .note(note)
                        .keyword(resolveKeywordName(id))
                        .build();
                note.getFeedbackKeywords().add(created);
                return created;
            });

            keyword.getFeedbackCards().add(FeedbackCard.builder()
                    .feedbackKeyword(keyword)
                    .title(card.title())
                    .content(card.content())
                    .build());
        }
    }

    private void replaceLyricsFeedbacks(Note note, List<LyricsFeedbackPayload> items) {
        note.getLyricsFeedbacks().clear();

        if (items == null) {
            return;
        }

        items.stream()
                .map(item -> LyricsFeedback.builder()
                        .note(note)
                        .lineText(item.lineText())
                        .feedbackTitle(item.feedbackTitle())
                        .problemText(item.problemText())
                        .solutionText(item.solutionText())
                        .build())
                .forEach(note.getLyricsFeedbacks()::add);
    }

    private String resolveKeywordName(String keywordId) {
        return DEFAULT_KEYWORDS.stream()
                .filter(keyword -> keyword.feedbackKeywordId().equals(keywordId))
                .findFirst()
                .map(KeywordItem::feedbackKeywordName)
                .orElse(keywordId);
    }

    private record LessonNoteGenerateResponse(
            @JsonProperty("session_id") String sessionId,
            String transcript,
            @JsonProperty("lesson_note") LessonNoteBody lessonNote
    ) {
    }

    private record LessonNoteBody(
            @JsonProperty("key_feedback") List<TitleContentPayload> keyFeedback,
            @JsonProperty("practice_guide") List<TitleContentPayload> practiceGuide,
            @JsonProperty("next_assignment") List<String> nextAssignment,
            @JsonProperty("feedback_card") List<FeedbackCardPayload> feedbackCards,
            @JsonProperty("lyrics_feedback") List<LyricsFeedbackPayload> lyricsFeedbacks
    ) {
    }

    private record TitleContentPayload(String title, String content) {
    }

    private record FeedbackCardPayload(
            @JsonProperty("feedback_keyword_id") String feedbackKeywordId,
            String title,
            String content
    ) {
    }

    private record LyricsFeedbackPayload(
            @JsonProperty("line_text") String lineText,
            @JsonProperty("feedback_title") String feedbackTitle,
            @JsonProperty("problem_text") String problemText,
            @JsonProperty("solution_text") String solutionText
    ) {
    }

    private record KeywordItem(
            @JsonProperty("feedback_keyword_id") String feedbackKeywordId,
            @JsonProperty("feedback_keyword_name") String feedbackKeywordName
    ) {
    }

    private record AiJobPayload(
            Long noteId,
            String audioPath,
            List<String> songTitles
    ) {
    }
}
