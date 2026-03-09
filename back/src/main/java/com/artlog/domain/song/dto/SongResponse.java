package com.artlog.domain.song.dto;

import com.artlog.domain.note.dto.NoteResponse.NoteSummary;
import com.artlog.domain.song.entity.UserSong;

import java.time.OffsetDateTime;
import java.util.List;

public class SongResponse {

    public record SongSummary(
            Long id,
            String title,
            OffsetDateTime createdAt
    ) {
        public static SongSummary from(UserSong song) {
            return new SongSummary(
                    song.getId(),
                    song.getTitle(),
                    song.getCreatedAt()
            );
        }
    }

    public record SongWithNotes(
            Long id,
            String title,
            List<NoteSummary> notes
    ) {}
}
