package com.artlog.domain.note.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.note.dto.NoteRequest.BulkDeleteRequest;
import com.artlog.domain.note.dto.NoteRequest.BulkMoveRequest;
import com.artlog.domain.note.dto.NoteRequest.MoveNoteRequest;
import com.artlog.domain.note.dto.NoteRequest.RenameNoteRequest;
import com.artlog.domain.note.dto.NoteResponse.NoteSummary;
import com.artlog.domain.note.service.NoteService;
import com.artlog.domain.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    /**
     * DELETE /api/v1/notes/{noteId}
     * 특정 노트 삭제
     */
    @DeleteMapping("/{noteId}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @AuthenticationPrincipal User user,
            @PathVariable Long noteId
    ) {
        noteService.deleteNote(user.getId(), noteId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    /**
     * PATCH /api/v1/notes/{noteId}/title
     * 노트 제목 변경
     */
    @PatchMapping("/{noteId}/title")
    public ResponseEntity<ApiResponse<NoteSummary>> renameNote(
            @AuthenticationPrincipal User user,
            @PathVariable Long noteId,
            @Valid @RequestBody RenameNoteRequest req
    ) {
        NoteSummary updated = noteService.renameNote(user.getId(), noteId, req);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * PATCH /api/v1/notes/{noteId}/move
     * 노트 폴더 변경
     */
    @PatchMapping("/{noteId}/move")
    public ResponseEntity<ApiResponse<NoteSummary>> moveNote(
            @AuthenticationPrincipal User user,
            @PathVariable Long noteId,
            @Valid @RequestBody MoveNoteRequest req
    ) {
        NoteSummary updated = noteService.moveNote(user.getId(), noteId, req);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * PATCH /api/v1/notes/bulk-move
     * 선택 노트 폴더 일괄 변경
     */
    @PatchMapping("/bulk-move")
    public ResponseEntity<ApiResponse<Void>> bulkMoveNotes(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody BulkMoveRequest req
    ) {
        noteService.bulkMoveNotes(user.getId(), req);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    /**
     * DELETE /api/v1/notes/bulk-delete
     * 선택 노트 일괄 삭제
     */
    @DeleteMapping("/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDeleteNotes(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody BulkDeleteRequest req
    ) {
        noteService.bulkDeleteNotes(user.getId(), req);
        return ResponseEntity.ok(ApiResponse.noContent());
    }
}
