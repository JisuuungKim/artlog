package com.artlog.domain.folder.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.folder.dto.FolderRequest.CreateFolderRequest;
import com.artlog.domain.folder.dto.FolderRequest.RenameFolderRequest;
import com.artlog.domain.folder.dto.FolderResponse.FolderSummary;
import com.artlog.domain.folder.entity.Folder;
import com.artlog.domain.folder.repository.FolderRepository;
import com.artlog.domain.note.repository.NoteRepository;
import com.artlog.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FolderService {

    private final FolderRepository folderRepository;
    private final NoteRepository noteRepository;

    /** 카테고리별(혹은 전체) 폴더 목록 조회 */
    public List<FolderSummary> getFolders(Long userId) {
        return folderRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream()
                .map(FolderSummary::from)
                .toList();
    }

    /** 새 폴더 생성 */
    @Transactional
    public FolderSummary createFolder(User user, CreateFolderRequest req) {
        Folder folder = Folder.builder()
                .name(req.name())
                .user(user)
                .isSystem(false)
                .build();
        return FolderSummary.from(folderRepository.save(folder));
    }

    /** 폴더 이름 변경 */
    @Transactional
    public FolderSummary renameFolder(Long userId, Long folderId, RenameFolderRequest req) {
        Folder folder = getFolderAndVerifyOwner(userId, folderId);

        if (Boolean.TRUE.equals(folder.getIsSystem())) {
            throw ArtlogException.badRequest("시스템 폴더의 이름은 변경할 수 없습니다.");
        }

        folder.rename(req.name());
        return FolderSummary.from(folder);
    }

    /**
     * 폴더 삭제
     * <ol>
     *   <li>소유자 검증 + 시스템 폴더 삭제 방지</li>
     *   <li>폴더에 속한 노트를 유저의 시스템('모든 노트') 폴더로 일괄 이동</li>
     *   <li>폴더 삭제</li>
     * </ol>
     */
    @Transactional
    public void deleteFolder(Long userId, Long folderId) {
        Folder folder = getFolderAndVerifyOwner(userId, folderId);

        if (Boolean.TRUE.equals(folder.getIsSystem())) {
            throw ArtlogException.badRequest("시스템 폴더는 삭제할 수 없습니다.");
        }

        // 유저의 '모든 노트' 시스템 폴더 조회
        Folder systemFolder = folderRepository.findByUserIdAndIsSystemTrue(userId)
                .orElseThrow(() -> ArtlogException.notFound("시스템 폴더를 찾을 수 없습니다."));

        // 소속 노트를 시스템 폴더로 벌크 이동
        noteRepository.moveFolderNotes(folderId, systemFolder.getId(), userId);

        folderRepository.delete(folder);
    }

    // --- 내부 헬퍼 ---

    private Folder getFolderAndVerifyOwner(Long userId, Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> ArtlogException.notFound("폴더를 찾을 수 없습니다."));
        if (!folder.getUser().getId().equals(userId)) {
            throw ArtlogException.forbidden("해당 폴더에 접근할 권한이 없습니다.");
        }
        return folder;
    }
}
