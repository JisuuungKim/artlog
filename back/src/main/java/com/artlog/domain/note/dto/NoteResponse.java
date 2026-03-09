package com.artlog.domain.note.dto;

import com.artlog.domain.note.entity.Note;
import com.artlog.domain.note.entity.NoteStatus;
import com.artlog.domain.note.entity.NoteType;

import java.time.OffsetDateTime;

public class NoteResponse {

    public record NoteSummary(
            Long id,
            String title,
            NoteType noteType,
            NoteStatus status,
            Long folderId,
            OffsetDateTime createdAt
    ) {
        public static NoteSummary from(Note note) {
            return new NoteSummary(
                    note.getId(),
                    note.getTitle(),
                    note.getNoteType(),
                    note.getStatus(),
                    note.getFolder() != null ? note.getFolder().getId() : null,
                    note.getCreatedAt()
            );
        }
    }
}
