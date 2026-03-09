package com.artlog.domain.note.entity;

import com.artlog.domain.song.entity.UserSong;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "note_song_tag")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class NoteSongTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_song_id", nullable = false)
    private UserSong userSong;
}
