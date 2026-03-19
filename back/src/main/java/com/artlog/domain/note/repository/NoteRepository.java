package com.artlog.domain.note.repository;

import com.artlog.domain.note.entity.Note;
import com.artlog.domain.note.entity.NoteType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    /** 특정 폴더의 노트 목록 — type이 null이면 전체 */
    @Query("SELECT n FROM Note n WHERE n.folder.id = :folderId AND n.user.id = :userId" +
           " AND (:noteType IS NULL OR n.noteType = :noteType)" +
           " ORDER BY n.createdAt DESC")
    List<Note> findByFolderAndType(
            @Param("folderId") Long folderId,
            @Param("userId") Long userId,
            @Param("noteType") NoteType noteType
    );

    /** 특정 노래에 태그된 노트 목록 */
    @Query("SELECT n FROM Note n JOIN n.noteSongTags nst" +
           " WHERE nst.userSong.id = :songId AND n.user.id = :userId" +
           " ORDER BY n.createdAt DESC")
    List<Note> findBySongIdAndUserId(
            @Param("songId") Long songId,
            @Param("userId") Long userId
    );

    @Query("SELECT n FROM Note n WHERE n.user.id = :userId" +
           " AND n.noteType = :noteType" +
           " AND (:categoryId IS NULL OR n.folder.category.id = :categoryId)" +
           " ORDER BY n.createdAt DESC")
    List<Note> findRecentByUserIdAndCategoryIdAndType(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("noteType") NoteType noteType,
            Pageable pageable
    );

    /** 소유자 확인용 단건 조회 */
    Optional<Note> findByIdAndUserId(Long id, Long userId);

    List<Note> findByIdInAndUserId(List<Long> noteIds, Long userId);

    /** 특정 폴더에 속한 노트를 다른 폴더로 벌크 이동 (폴더 삭제 시 사용) */
    @Modifying
    @Query("UPDATE Note n SET n.folder.id = :targetFolderId WHERE n.folder.id = :sourceFolderId AND n.user.id = :userId")
    int moveFolderNotes(
            @Param("sourceFolderId") Long sourceFolderId,
            @Param("targetFolderId") Long targetFolderId,
            @Param("userId") Long userId
    );

    /** 선택 노트 일괄 삭제 */
    @Modifying
    @Query("DELETE FROM Note n WHERE n.id IN :noteIds AND n.user.id = :userId")
    int bulkDeleteNotes(
            @Param("noteIds") List<Long> noteIds,
            @Param("userId") Long userId
    );
}
