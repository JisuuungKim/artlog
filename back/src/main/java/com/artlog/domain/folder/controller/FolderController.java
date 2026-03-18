package com.artlog.domain.folder.controller;

import com.artlog.common.dto.ApiResponse;
import com.artlog.domain.folder.dto.FolderRequest.CreateFolderRequest;
import com.artlog.domain.folder.dto.FolderRequest.RenameFolderRequest;
import com.artlog.domain.folder.dto.FolderResponse.FolderSummary;
import com.artlog.domain.folder.service.FolderService;
import com.artlog.domain.note.dto.NoteResponse.NoteSummary;
import com.artlog.domain.note.service.NoteService;
import com.artlog.domain.user.entity.User;
import com.artlog.global.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;
    private final NoteService noteService;

    /**
     * GET /api/v1/folders
     * 카테고리별 폴더 목록 조회 (category_id 미사용 시 전체)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FolderSummary>>> getFolders(
            @AuthenticationPrincipal Object principal
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        List<FolderSummary> folders = folderService.getFolders(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(folders));
    }

    /**
     * POST /api/v1/folders
     * 새 폴더 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FolderSummary>> createFolder(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody CreateFolderRequest req
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        FolderSummary created = folderService.createFolder(user, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
    }

    /**
     * PATCH /api/v1/folders/{folderId}
     * 폴더 이름 변경
     */
    @PatchMapping("/{folderId}")
    public ResponseEntity<ApiResponse<FolderSummary>> renameFolder(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long folderId,
            @Valid @RequestBody RenameFolderRequest req
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        FolderSummary updated = folderService.renameFolder(user.getId(), folderId, req);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    /**
     * DELETE /api/v1/folders/{folderId}
     * 폴더 삭제 (소속 노트는 '모든 노트' 폴더로 이동)
     */
    @DeleteMapping("/{folderId}")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long folderId
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        folderService.deleteFolder(user.getId(), folderId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    /**
     * GET /api/v1/folders/{folderId}/notes?type=ALL|LESSON|PRACTICE
     * 특정 폴더의 노트 목록 조회
     */
    @GetMapping("/{folderId}/notes")
    public ResponseEntity<ApiResponse<List<NoteSummary>>> getNotesByFolder(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long folderId,
            @RequestParam(defaultValue = "ALL") String type
    ) {
        User user = AuthenticatedUserResolver.resolve(principal);
        List<NoteSummary> notes = noteService.getNotesByFolder(user.getId(), folderId, type);
        return ResponseEntity.ok(ApiResponse.ok(notes));
    }
}
