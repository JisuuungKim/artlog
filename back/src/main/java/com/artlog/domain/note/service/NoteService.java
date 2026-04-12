package com.artlog.domain.note.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.category.entity.Category;
import com.artlog.domain.category.service.CategoryFolderPolicyService;
import com.artlog.domain.folder.entity.Folder;
import com.artlog.domain.folder.repository.FolderRepository;
import com.artlog.domain.note.dto.NoteRequest.BulkDeleteRequest;
import com.artlog.domain.note.dto.NoteRequest.BulkMoveRequest;
import com.artlog.domain.note.dto.NoteRequest.CreateLessonNoteRequest;
import com.artlog.domain.note.dto.NoteRequest.MoveNoteRequest;
import com.artlog.domain.note.dto.NoteRequest.RenameNoteRequest;
import com.artlog.domain.note.dto.NoteResponse.CreatedLessonNote;
import com.artlog.domain.note.dto.NoteResponse.NoteDetail;
import com.artlog.domain.note.dto.NoteResponse.NoteSummary;
import com.artlog.domain.note.dto.NoteResponse.UploadedLessonAudio;
import com.artlog.domain.note.entity.Note;
import com.artlog.domain.note.entity.NoteSongTag;
import com.artlog.domain.note.entity.NoteStatus;
import com.artlog.domain.note.entity.NoteType;
import com.artlog.domain.note.repository.NoteRepository;
import com.artlog.domain.song.entity.UserSong;
import com.artlog.domain.song.repository.UserSongRepository;
import com.artlog.domain.user.entity.User;
import com.artlog.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {
    private final CategoryFolderPolicyService categoryFolderPolicyService;
    private final NoteRepository noteRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final UserSongRepository userSongRepository;
    private final LessonNoteJobQueueService lessonNoteJobQueueService;
    private final LessonNoteEventService lessonNoteEventService;

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    /** 특정 폴더의 노트 목록 조회 (type: ALL → null, LESSON, PRACTICE) */
    public List<NoteSummary> getNotesByFolder(User user, Long folderId, String type) {
        getFolderAndVerifyOwner(user, folderId);

        NoteType noteType = resolveNoteType(type);
        return noteRepository.findByFolderAndType(folderId, user.getId(), noteType)
                .stream()
                .map(NoteSummary::from)
                .toList();
    }

    public List<NoteSummary> getRecentLessonNotes(User user, Long categoryId) {
        List<Note> notes;

        if (categoryId == null) {
            List<Long> categoryIds = categoryFolderPolicyService.getUserInterestCategoryIds(user);
            if (categoryIds.isEmpty()) {
                return List.of();
            }
            notes = noteRepository.findRecentByUserIdAndCategoryIdsAndType(
                    user.getId(),
                    categoryIds,
                    NoteType.LESSON,
                    PageRequest.of(0, 10)
            );
        } else {
            Long resolvedCategoryId = categoryFolderPolicyService
                    .resolveUserInterestCategory(user, categoryId)
                    .getId();
            notes = noteRepository.findRecentByUserIdAndCategoryIdAndType(
                    user.getId(),
                    resolvedCategoryId,
                    NoteType.LESSON,
                    PageRequest.of(0, 10)
            );
        }

        return notes.stream()
                .map(NoteSummary::from)
                .toList();
    }

    @Transactional
    public UploadedLessonAudio uploadLessonAudio(Long userId, MultipartFile audio) {
        userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> ArtlogException.notFound("사용자를 찾을 수 없습니다."));

        if (audio == null || audio.isEmpty()) {
            throw ArtlogException.badRequest("오디오 파일은 필수입니다.");
        }

        return new UploadedLessonAudio(storeAudioFile(audio).toString());
    }

    @Transactional
    public CreatedLessonNote createLessonNote(
            Long userId,
            MultipartFile audio,
            CreateLessonNoteRequest req
    ) {
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> ArtlogException.notFound("사용자를 찾을 수 없습니다."));
        Category category = categoryFolderPolicyService.resolveUserInterestCategory(user, req.categoryId());
        user.refreshMonthlyLessonNoteQuota(OffsetDateTime.now());
        if (!user.hasRemainingLessonNoteQuota()) {
            throw ArtlogException.badRequest("이번 달 레슨노트 생성 횟수를 모두 사용했습니다.");
        }

        Note note = Note.builder()
                .user(user)
                .folder(categoryFolderPolicyService.resolveFolder(user, req.folderId(), category))
                .noteType(NoteType.LESSON)
                .title(resolveTitle(req.title()))
                .recordingUrl(resolveRecordingUrl(audio, req.uploadedAudioPath()))
                .keyFeedback(List.of())
                .practiceGuide(List.of())
                .nextAssignment(List.of())
                .status(NoteStatus.PROCESSING)
                .conditionText(trimToNull(req.conditionText()))
                .startTime(OffsetDateTime.now())
                .build();

        attachSongs(note, user, category, req.songTitles());

        Note saved = noteRepository.save(note);
        user.decreaseRemainingCount();
        triggerLessonProcessingAfterCommit(saved.getId());
        return CreatedLessonNote.from(saved);
    }

    public NoteDetail getNoteDetail(User user, Long noteId) {
        Note note = getNoteAndVerifyOwner(user, noteId);
        return NoteDetail.from(note);
    }

    @Transactional
    public void retryLessonNoteProcessing(User user, Long noteId) {
        Note note = getNoteAndVerifyOwner(user, noteId);
        if (note.getNoteType() != NoteType.LESSON) {
            throw ArtlogException.badRequest("레슨 노트만 재처리할 수 있습니다.");
        }
        if (trimToNull(note.getRecordingUrl()) == null) {
            throw ArtlogException.badRequest("재처리할 오디오 파일이 없습니다.");
        }

        note.prepareForProcessing();
        triggerLessonProcessingAfterCommit(note.getId());
    }

    /** 노트 삭제 */
    @Transactional
    public void deleteNote(User user, Long noteId) {
        Note note = getNoteAndVerifyOwner(user, noteId);
        if (note.getNoteType() == NoteType.LESSON && note.getStatus() == NoteStatus.PROCESSING) {
            note.getUser().restoreLessonNoteQuota(OffsetDateTime.now());
        }
        noteRepository.delete(note);
    }

    /** 노트 제목 변경 */
    @Transactional
    public NoteSummary renameNote(User user, Long noteId, RenameNoteRequest req) {
        Note note = getNoteAndVerifyOwner(user, noteId);
        note.rename(req.title());
        return NoteSummary.from(note);
    }

    /** 노트 폴더 변경 */
    @Transactional
    public NoteSummary moveNote(User user, Long noteId, MoveNoteRequest req) {
        Note note = getNoteAndVerifyOwner(user, noteId);
        Folder targetFolder = getFolderAndVerifyOwner(user, req.folderId());
        note.moveToFolder(targetFolder);
        return NoteSummary.from(note);
    }

    /** 선택 노트 폴더 일괄 변경 */
    @Transactional
    public void bulkMoveNotes(User user, BulkMoveRequest req) {
        Folder targetFolder = getFolderAndVerifyOwner(user, req.folderId());
        noteRepository.findByIdInAndUserId(req.noteIds(), user.getId())
                .stream()
                .peek(note -> validateNoteCategoryAccess(user, note))
                .forEach(note -> note.moveToFolder(targetFolder));
    }

    /** 선택 노트 일괄 삭제 */
    @Transactional
    public void bulkDeleteNotes(User user, BulkDeleteRequest req) {
        noteRepository.findByIdInAndUserId(req.noteIds(), user.getId())
                .forEach(note -> validateNoteCategoryAccess(user, note));
        noteRepository.bulkDeleteNotes(req.noteIds(), user.getId());
    }

    // --- 내부 헬퍼 ---

    private Note getNoteAndVerifyOwner(User user, Long noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
                .orElseThrow(() -> ArtlogException.notFound("노트를 찾을 수 없거나 접근 권한이 없습니다."));
        validateNoteCategoryAccess(user, note);
        return note;
    }

    private Folder getFolderAndVerifyOwner(User user, Long folderId) {
        Folder folder = folderRepository.findByIdAndUser_Id(folderId, user.getId())
                .orElseThrow(() -> ArtlogException.notFound("폴더를 찾을 수 없거나 접근 권한이 없습니다."));
        categoryFolderPolicyService.validateUserInterestCategory(user, folder.getCategory());
        return folder;
    }

    private void validateNoteCategoryAccess(User user, Note note) {
        Folder folder = note.getFolder();
        if (folder == null) {
            throw ArtlogException.notFound("관심 카테고리에서만 접근할 수 있습니다.");
        }
        categoryFolderPolicyService.validateUserInterestCategory(user, folder.getCategory());
    }

    private void attachSongs(Note note, User user, Category category, List<String> songTitles) {
        if (songTitles == null) {
            return;
        }

        songTitles.stream()
                .map(this::trimToNull)
                .filter(title -> title != null)
                .distinct()
                .map(title -> findOrCreateSong(user, category, title))
                .map(song -> NoteSongTag.builder()
                        .note(note)
                        .userSong(song)
                        .build())
                .forEach(note.getNoteSongTags()::add);
    }

    private UserSong findOrCreateSong(User user, Category category, String title) {
        return userSongRepository.findByUserIdAndCategoryIdAndTitleIgnoreCase(user.getId(), category.getId(), title)
                .orElseGet(() -> userSongRepository.save(UserSong.builder()
                        .user(user)
                        .title(title)
                        .category(category)
                        .build()));
    }

    private void triggerLessonProcessingAfterCommit(Long noteId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                lessonNoteEventService.update(noteId, NoteStatus.PROCESSING, "queued");
                lessonNoteJobQueueService.enqueue(noteId);
            }
        });
    }

    private Path storeAudioFile(MultipartFile audio) {
        String extension = extractExtension(audio.getOriginalFilename());
        Path directory = Path.of(uploadDir);
        Path filePath = directory.resolve(UUID.randomUUID() + extension);

        try {
            Files.createDirectories(directory);
            Files.copy(audio.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return filePath;
        } catch (IOException exception) {
            throw new ArtlogException(HttpStatus.INTERNAL_SERVER_ERROR, "오디오 파일 저장에 실패했습니다.");
        }
    }

    private String resolveRecordingUrl(MultipartFile audio, String uploadedAudioPath) {
        if (audio != null && !audio.isEmpty()) {
            return storeAudioFile(audio).toString();
        }

        String normalizedPath = trimToNull(uploadedAudioPath);
        if (normalizedPath == null) {
            throw ArtlogException.badRequest("오디오 파일은 필수입니다.");
        }

        Path uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        Path resolvedPath = Path.of(normalizedPath).toAbsolutePath().normalize();

        if (!resolvedPath.startsWith(uploadRoot) || !Files.exists(resolvedPath)) {
            throw ArtlogException.badRequest("유효하지 않은 업로드 파일 경로입니다.");
        }

        return resolvedPath.toString();
    }

    private String resolveTitle(String title) {
        String normalized = trimToNull(title);
        if (normalized != null) {
            return normalized;
        }

        return OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy.MM.dd. 레슨노트", Locale.KOREA));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String extractExtension(String fileName) {
        if (fileName == null) {
            return ".m4a";
        }

        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0) {
            return ".m4a";
        }

        return fileName.substring(dotIndex);
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
