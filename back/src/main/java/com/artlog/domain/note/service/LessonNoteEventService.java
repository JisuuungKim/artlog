package com.artlog.domain.note.service;

import com.artlog.domain.note.entity.NoteStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class LessonNoteEventService {

    private static final long TIMEOUT_MS = 30L * 60L * 1000L;
    private static final Duration PROGRESS_TTL = Duration.ofDays(1);
    private static final Map<String, ProgressStep> PROGRESS_STEPS = Map.of(
            "queued", new ProgressStep(5, "레슨노트를 준비하고 있어요."),
            "stt", new ProgressStep(15, "녹음본을 이해하고 있어요."),
            "correction", new ProgressStep(35, "레슨 내용을 정리하고 있어요."),
            "feedback_analysis", new ProgressStep(55, "선생님의 피드백을 살펴보고 있어요."),
            "lesson_note", new ProgressStep(75, "연습에 도움이 되도록 노트를 만들고 있어요."),
            "review_lesson_note", new ProgressStep(90, "노트 내용을 한 번 더 확인하고 있어요."),
            "completed", new ProgressStep(100, "레슨노트가 준비됐어요."),
            "failed", new ProgressStep(100, "레슨노트 생성에 실패했어요.")
    );

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public SseEmitter subscribe(Long noteId, NoteStatus status) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitter.onCompletion(() -> remove(noteId, emitter));
        emitter.onTimeout(() -> remove(noteId, emitter));
        emitter.onError(error -> remove(noteId, emitter));

        if (status == NoteStatus.PROCESSING) {
            emitters.computeIfAbsent(noteId, key -> new CopyOnWriteArrayList<>()).add(emitter);
            send(emitter, getCurrentProgress(noteId, status), false);
            return emitter;
        }

        send(emitter, buildProgress(noteId, status, stageFor(status)), true);
        return emitter;
    }

    public void update(Long noteId, NoteStatus status, String stage) {
        LessonNoteProgress progress = buildProgress(noteId, status, stage);
        saveProgress(progress);

        List<SseEmitter> noteEmitters = emitters.get(noteId);
        if (noteEmitters == null) {
            return;
        }

        noteEmitters.forEach(emitter -> send(emitter, progress, false));
    }

    public void complete(Long noteId, NoteStatus status) {
        LessonNoteProgress progress = buildProgress(noteId, status, stageFor(status));
        saveProgress(progress);

        List<SseEmitter> noteEmitters = emitters.remove(noteId);
        if (noteEmitters == null) {
            return;
        }

        noteEmitters.forEach(emitter -> send(emitter, progress, true));
    }

    private void remove(Long noteId, SseEmitter emitter) {
        List<SseEmitter> noteEmitters = emitters.get(noteId);
        if (noteEmitters == null) {
            return;
        }

        noteEmitters.remove(emitter);
        if (noteEmitters.isEmpty()) {
            emitters.remove(noteId);
        }
    }

    private LessonNoteProgress getCurrentProgress(Long noteId, NoteStatus status) {
        return findSavedProgress(noteId).orElseGet(() -> buildProgress(noteId, status, "queued"));
    }

    private Optional<LessonNoteProgress> findSavedProgress(Long noteId) {
        String value = stringRedisTemplate.opsForValue().get(progressKey(noteId));
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(objectMapper.readValue(value, LessonNoteProgress.class));
        } catch (JsonProcessingException exception) {
            stringRedisTemplate.delete(progressKey(noteId));
            return Optional.empty();
        }
    }

    private void saveProgress(LessonNoteProgress progress) {
        try {
            stringRedisTemplate.opsForValue().set(
                    progressKey(progress.noteId()),
                    objectMapper.writeValueAsString(progress),
                    PROGRESS_TTL
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("레슨노트 진행 상태를 저장할 수 없습니다.", exception);
        }
    }

    private LessonNoteProgress buildProgress(Long noteId, NoteStatus status, String stage) {
        ProgressStep step = PROGRESS_STEPS.getOrDefault(stage, PROGRESS_STEPS.get("queued"));
        return new LessonNoteProgress(noteId, status, stage, step.progress(), step.message());
    }

    private String stageFor(NoteStatus status) {
        return switch (status) {
            case COMPLETED -> "completed";
            case FAILED -> "failed";
            default -> "queued";
        };
    }

    private String progressKey(Long noteId) {
        return "lesson-note:progress:" + noteId;
    }

    private void send(SseEmitter emitter, LessonNoteProgress progress, boolean complete) {
        try {
            emitter.send(SseEmitter.event().name("progress").data(progress, MediaType.APPLICATION_JSON));
            if (complete) {
                emitter.complete();
            }
        } catch (IOException | IllegalStateException exception) {
            emitter.completeWithError(exception);
        }
    }

    private record ProgressStep(int progress, String message) {
    }
}
