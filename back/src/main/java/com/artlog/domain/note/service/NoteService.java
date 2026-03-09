package com.artlog.domain.note.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.folder.entity.Folder;
import com.artlog.domain.folder.repository.FolderRepository;
import com.artlog.domain.note.dto.NoteRequest.BulkDeleteRequest;
import com.artlog.domain.note.dto.NoteRequest.BulkMoveRequest;
import com.artlog.domain.note.dto.NoteRequest.MoveNoteRequest;
import com.artlog.domain.note.dto.NoteRequest.RenameNoteRequest;
import com.artlog.domain.note.dto.NoteResponse.NoteSummary;
import com.artlog.domain.note.entity.Note;
import com.artlog.domain.note.entity.NoteType;
import com.artlog.domain.note.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final FolderRepository folderRepository;

    /** 특정 폴더의 노트 목록 조회 (type: ALL → null, LESSON, PRACTICE) */
    public List<NoteSummary> getNotesByFolder(Long userId, Long folderId, String type) {
        // 폴더 소유자 검증
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> ArtlogException.notFound("폴더를 찾을 수 없습니다."));
        if (!folder.getUser().getId().equals(userId)) {
            throw ArtlogException.forbidden("해당 폴더에 접근할 권한이 없습니다.");
        }

        NoteType noteType = resolveNoteType(type);
        return noteRepository.findByFolderAndType(folderId, userId, noteType)
                .stream()
                .map(NoteSummary::from)
                .toList();
    }

    /** 노트 삭제 */
    @Transactional
    public void deleteNote(Long userId, Long noteId) {
        Note note = getNoteAndVerifyOwner(userId, noteId);
        noteRepository.delete(note);
    }

    /** 노트 제목 변경 */
    @Transactional
    public NoteSummary renameNote(Long userId, Long noteId, RenameNoteRequest req) {
        Note note = getNoteAndVerifyOwner(userId, noteId);
        note.rename(req.title());
        return NoteSummary.from(note);
    }

    /** 노트 폴더 변경 */
    @Transactional
    public NoteSummary moveNote(Long userId, Long noteId, MoveNoteRequest req) {
        Note note = getNoteAndVerifyOwner(userId, noteId);
        Folder targetFolder = getFolderAndVerifyOwner(userId, req.folderId());
        note.moveToFolder(targetFolder);
        return NoteSummary.from(note);
    }

    /** 선택 노트 폴더 일괄 변경 */
    @Transactional
    public void bulkMoveNotes(Long userId, BulkMoveRequest req) {
        // 대상 폴더 소유자 검증
        getFolderAndVerifyOwner(userId, req.folderId());
        noteRepository.bulkMoveNotes(req.noteIds(), req.folderId(), userId);
    }

    /** 선택 노트 일괄 삭제 */
    @Transactional
    public void bulkDeleteNotes(Long userId, BulkDeleteRequest req) {
        noteRepository.bulkDeleteNotes(req.noteIds(), userId);
    }

    // --- 내부 헬퍼 ---

    private Note getNoteAndVerifyOwner(Long userId, Long noteId) {
        return noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> ArtlogException.notFound("노트를 찾을 수 없거나 접근 권한이 없습니다."));
    }

    private Folder getFolderAndVerifyOwner(Long userId, Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> ArtlogException.notFound("폴더를 찾을 수 없습니다."));
        if (!folder.getUser().getId().equals(userId)) {
            throw ArtlogException.forbidden("해당 폴더에 접근할 권한이 없습니다.");
        }
        return folder;
    }

    private NoteType resolveNoteType(String type) {
        if (type == null || type.equalsIgnoreCase("ALL")) return null;
        try {
            return NoteType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ArtlogException.badRequest("유효하지 않은 노트 타입입니다: " + type);
        }
    }
}
