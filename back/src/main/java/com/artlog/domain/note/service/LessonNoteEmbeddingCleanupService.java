package com.artlog.domain.note.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonNoteEmbeddingCleanupService {

    private final JdbcTemplate jdbcTemplate;

    public void deleteByNoteId(Long userId, Long noteId) {
        if (userId == null || noteId == null || !embeddingTableExists()) {
            return;
        }

        jdbcTemplate.update(
                "DELETE FROM public.lesson_note_embedding WHERE user_id = ? AND note_id = ?",
                userId,
                noteId
        );
    }

    public void deleteByNoteIds(Long userId, List<Long> noteIds) {
        if (userId == null || noteIds == null || noteIds.isEmpty() || !embeddingTableExists()) {
            return;
        }

        noteIds.stream()
                .filter(noteId -> noteId != null)
                .forEach(noteId -> deleteByNoteId(userId, noteId));
    }

    private boolean embeddingTableExists() {
        try {
            return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                    "SELECT to_regclass('public.lesson_note_embedding') IS NOT NULL",
                    Boolean.class
            ));
        } catch (Exception exception) {
            log.warn("lesson_note_embedding 테이블 확인 실패. embedding 삭제를 건너뜁니다.", exception);
            return false;
        }
    }
}
