package com.artlog.domain.song.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.song.dto.SongRequest.RenameSongRequest;
import com.artlog.domain.song.dto.SongResponse.SongSummary;
import com.artlog.domain.song.dto.SongResponse.SongWithNotes;
import com.artlog.domain.song.service.UserSongService;
import com.artlog.domain.user.entity.User;
import com.artlog.global.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/songs")
@RequiredArgsConstructor
public class UserSongController {

    private final UserSongService userSongService;

    /**
     * GET /api/v1/songs?category_id=
     * 카테고리별 노래 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SongSummary>>> getSongs(
            @AuthenticationPrincipal Object principal,
            @RequestParam(required = false) Long categoryId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        List<SongSummary> songs = userSongService.getSongsByCategory(user.getId(), categoryId);
        return ResponseEntity.ok(ApiResponse.ok(songs));
    }

    /**
     * GET /api/v1/songs/{songId}/notes
     * 특정 노래의 노트 목록 조회
     */
    @GetMapping("/{songId}/notes")
    public ResponseEntity<ApiResponse<SongWithNotes>> getNotesBySong(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long songId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        SongWithNotes result = userSongService.getNotesBySong(user.getId(), songId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * PATCH /api/v1/songs/{songId}
     * 노래 제목 변경
     */
    @PatchMapping("/{songId}")
    public ResponseEntity<ApiResponse<SongSummary>> renameSong(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long songId,
            @Valid @RequestBody RenameSongRequest req
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        SongSummary updated = userSongService.renameSong(user.getId(), songId, req);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * DELETE /api/v1/songs/{songId}
     * 노래 삭제
     */
    @DeleteMapping("/{songId}")
    public ResponseEntity<ApiResponse<Void>> deleteSong(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long songId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        userSongService.deleteSong(user.getId(), songId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }
}
