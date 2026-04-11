package com.artlog.domain.note.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.note.dto.NoteRequest.CreateLessonNoteRequest;
import com.artlog.domain.note.dto.NoteRequest.BulkDeleteRequest;
import com.artlog.domain.note.dto.NoteRequest.BulkMoveRequest;
import com.artlog.domain.note.dto.NoteRequest.MoveNoteRequest;
import com.artlog.domain.note.dto.NoteRequest.RenameNoteRequest;
import com.artlog.domain.note.dto.NoteResponse.CreatedLessonNote;
import com.artlog.domain.note.dto.NoteResponse.NoteDetail;
import com.artlog.domain.note.dto.NoteResponse.NoteSummary;
import com.artlog.domain.note.dto.NoteResponse.UploadedLessonAudio;
import com.artlog.domain.note.service.LessonNoteEventService;
import com.artlog.domain.note.service.NoteService;
import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import com.artlog.global.security.AuthenticatedUserResolver;
import com.artlog.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final LessonNoteEventService lessonNoteEventService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @PostMapping(value = "/audio-upload", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<UploadedLessonAudio>> uploadLessonAudio(
            @AuthenticationPrincipal Object principal,
            @RequestPart("audio") MultipartFile audio
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        UploadedLessonAudio uploaded = noteService.uploadLessonAudio(user.getId(), audio);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(uploaded));
    }

    @PostMapping(value = "/lesson-upload", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<CreatedLessonNote>> createLessonNote(
            @AuthenticationPrincipal Object principal,
            @RequestPart(value = "audio", required = false) MultipartFile audio,
            @Valid @RequestPart("payload") CreateLessonNoteRequest req
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        CreatedLessonNote created = noteService.createLessonNote(user.getId(), audio, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
    }

    @GetMapping("/recent-lessons")
    public ResponseEntity<ApiResponse<java.util.List<NoteSummary>>> getRecentLessonNotes(
            @AuthenticationPrincipal Object principal,
            @RequestParam(required = false) Long categoryId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        return ResponseEntity.ok(ApiResponse.ok(noteService.getRecentLessonNotes(user, categoryId)));
    }

    @GetMapping("/{noteId}")
    public ResponseEntity<ApiResponse<NoteDetail>> getNoteDetail(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long noteId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        return ResponseEntity.ok(ApiResponse.ok(noteService.getNoteDetail(user, noteId)));
    }

    @GetMapping(value = "/{noteId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeLessonNoteEvents(
            HttpServletRequest request,
            @PathVariable Long noteId
    ) {
        User user = resolveSseUser(request);
        NoteDetail note = noteService.getNoteDetail(user, noteId);
        return lessonNoteEventService.subscribe(noteId, note.status());
    }

    @PostMapping("/{noteId}/retry-processing")
    public ResponseEntity<ApiResponse<Void>> retryLessonNoteProcessing(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long noteId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        noteService.retryLessonNoteProcessing(user, noteId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    /**
     * DELETE /api/v1/notes/{noteId}
     * 특정 노트 삭제
     */
    @DeleteMapping("/{noteId}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long noteId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        noteService.deleteNote(user, noteId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    /**
     * PATCH /api/v1/notes/{noteId}/title
     * 노트 제목 변경
     */
    @PatchMapping("/{noteId}/title")
    public ResponseEntity<ApiResponse<NoteSummary>> renameNote(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long noteId,
            @Valid @RequestBody RenameNoteRequest req
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        NoteSummary updated = noteService.renameNote(user, noteId, req);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * PATCH /api/v1/notes/{noteId}/move
     * 노트 폴더 변경
     */
    @PatchMapping("/{noteId}/move")
    public ResponseEntity<ApiResponse<NoteSummary>> moveNote(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long noteId,
            @Valid @RequestBody MoveNoteRequest req
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        NoteSummary updated = noteService.moveNote(user, noteId, req);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * PATCH /api/v1/notes/bulk-move
     * 선택 노트 폴더 일괄 변경
     */
    @PatchMapping("/bulk-move")
    public ResponseEntity<ApiResponse<Void>> bulkMoveNotes(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody BulkMoveRequest req
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        noteService.bulkMoveNotes(user, req);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    /**
     * DELETE /api/v1/notes/bulk-delete
     * 선택 노트 일괄 삭제
     */
    @DeleteMapping("/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDeleteNotes(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody BulkDeleteRequest req
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        noteService.bulkDeleteNotes(user, req);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    private User resolveSseUser(HttpServletRequest request) {
        String accessToken = request.getParameter("accessToken");
        if (accessToken == null || accessToken.isBlank()) {
            String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authorization != null && authorization.startsWith("Bearer ")) {
                accessToken = authorization.substring(7);
            }
        }

        if (accessToken == null
                || accessToken.isBlank()
                || !jwtTokenProvider.validateAccessToken(accessToken)) {
            throw ArtlogException.unauthorized("인증이 필요합니다.");
        }

        Long userId = jwtTokenProvider.getUserId(accessToken);
        return userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> ArtlogException.unauthorized("인증이 필요합니다."));
    }
}
