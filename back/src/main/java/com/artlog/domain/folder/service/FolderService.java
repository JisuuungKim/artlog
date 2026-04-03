package com.artlog.domain.folder.service;

import com.artlog.common.exception.ArtlogException;
import com.artlog.domain.category.entity.Category;
import com.artlog.domain.category.service.CategoryFolderPolicyService;
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
    private final CategoryFolderPolicyService categoryFolderPolicyService;
    private final FolderRepository folderRepository;
    private final NoteRepository noteRepository;

    /** 카테고리별(혹은 전체) 폴더 목록 조회 */
    public List<FolderSummary> getFolders(User user, Long categoryId) {
        List<Folder> folders;

        if (categoryId == null) {
            List<Long> categoryIds = categoryFolderPolicyService.getUserInterestCategoryIds(user);
            if (categoryIds.isEmpty()) {
                return List.of();
            }
            folders = folderRepository.findByUserIdAndCategoryIdsOrderByCreatedAtAsc(user.getId(), categoryIds);
        } else {
            Category category = categoryFolderPolicyService.resolveUserInterestCategory(user, categoryId);
            folders = folderRepository.findByUserIdAndCategoryIdOrderByCreatedAtAsc(user.getId(), category.getId());
        }

        return folders
                .stream()
                .map(FolderSummary::from)
                .toList();
    }

    /** 새 폴더 생성 */
    @Transactional
    public FolderSummary createFolder(User user, CreateFolderRequest req) {
        Category category = categoryFolderPolicyService.resolveUserInterestCategory(user, req.categoryId());

        Folder folder = Folder.builder()
                .name(req.name())
                .user(user)
                .isSystem(false)
                .category(category)
                .build();
        return FolderSummary.from(folderRepository.save(folder));
    }

    /** 폴더 이름 변경 */
    @Transactional
    public FolderSummary renameFolder(User user, Long folderId, RenameFolderRequest req) {
        Folder folder = getFolderAndVerifyOwner(user, folderId);

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
    public void deleteFolder(User user, Long folderId) {
        Folder folder = getFolderAndVerifyOwner(user, folderId);

        if (Boolean.TRUE.equals(folder.getIsSystem())) {
            throw ArtlogException.badRequest("시스템 폴더는 삭제할 수 없습니다.");
        }

        Long categoryId = folder.getCategory() != null ? folder.getCategory().getId() : null;
        Folder targetFolder = folderRepository.findFirstByUserIdAndCategory_IdAndIdNotOrderByCreatedAtAsc(
                        user.getId(),
                        categoryId,
                        folderId
                )
                .orElseGet(() -> categoryFolderPolicyService.createDefaultFolder(folder.getUser(), folder.getCategory()));

        // 소속 노트를 기본 폴더(또는 다른 첫 폴더)로 벌크 이동
        noteRepository.moveFolderNotes(folderId, targetFolder.getId(), user.getId());

        folderRepository.delete(folder);
    }

    // --- 내부 헬퍼 ---

    private Folder getFolderAndVerifyOwner(User user, Long folderId) {
        Folder folder = folderRepository.findByIdAndUser_Id(folderId, user.getId())
                .orElseThrow(() -> ArtlogException.notFound("폴더를 찾을 수 없거나 접근 권한이 없습니다."));
        categoryFolderPolicyService.validateUserInterestCategory(user, folder.getCategory());
        return folder;
    }
}
