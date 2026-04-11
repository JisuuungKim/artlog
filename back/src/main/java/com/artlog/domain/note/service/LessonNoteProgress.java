package com.artlog.domain.note.service;

import com.artlog.domain.note.entity.NoteStatus;

public record LessonNoteProgress(
        Long noteId,
        NoteStatus status,
        String stage,
        int progress,
        String message
) {
}
