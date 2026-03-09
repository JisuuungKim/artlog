package com.artlog.domain.song.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.note.dto.NoteResponse.NoteSummary;
import com.artlog.domain.note.repository.NoteRepository;
import com.artlog.domain.song.dto.SongRequest.RenameSongRequest;
import com.artlog.domain.song.dto.SongResponse.SongSummary;
import com.artlog.domain.song.dto.SongResponse.SongWithNotes;
import com.artlog.domain.song.entity.UserSong;
import com.artlog.domain.song.repository.UserSongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserSongService {

    private final UserSongRepository userSongRepository;
    private final NoteRepository noteRepository;

    /** 카테고리별 노래 목록 조회 (categoryId null → 전체) */
    public List<SongSummary> getSongsByCategory(Long userId, Long categoryId) {
        return userSongRepository.findByUserIdAndCategoryId(userId, categoryId)
                .stream()
                .map(SongSummary::from)
                .toList();
    }

    /** 특정 노래의 노트 목록 조회 */
    public SongWithNotes getNotesBySong(Long userId, Long songId) {
        UserSong song = getSongAndVerifyOwner(userId, songId);

        List<NoteSummary> notes = noteRepository.findBySongIdAndUserId(songId, userId)
                .stream()
                .map(NoteSummary::from)
                .toList();

        return new SongWithNotes(song.getId(), song.getTitle(), notes);
    }

    /** 노래 제목 변경 */
    @Transactional
    public SongSummary renameSong(Long userId, Long songId, RenameSongRequest req) {
        UserSong song = getSongAndVerifyOwner(userId, songId);
        song.rename(req.title());
        return SongSummary.from(song);
    }

    /** 노래 삭제 */
    @Transactional
    public void deleteSong(Long userId, Long songId) {
        UserSong song = getSongAndVerifyOwner(userId, songId);
        userSongRepository.delete(song);
    }

    // --- 내부 헬퍼 ---

    private UserSong getSongAndVerifyOwner(Long userId, Long songId) {
        return userSongRepository.findByIdAndUserId(songId, userId)
                .orElseThrow(() -> ArtlogException.notFound("노래를 찾을 수 없거나 접근 권한이 없습니다."));
    }
}
