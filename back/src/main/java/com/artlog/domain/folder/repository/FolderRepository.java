package com.artlog.domain.folder.repository;

import com.artlog.domain.folder.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    /** 특정 유저의 카테고리별 폴더 목록 — categoryId가 null이면 전체 조회 */
    @Query("SELECT f FROM Folder f WHERE f.user.id = :userId" +
           " AND (:categoryId IS NULL OR f.category.id = :categoryId)" +
           " ORDER BY f.createdAt ASC")
    List<Folder> findByUserIdAndCategoryIdOrderByCreatedAtAsc(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId
    );

    /** 유저의 시스템 폴더('모든 노트') 조회 */
    Optional<Folder> findByUserIdAndIsSystemTrue(Long userId);

    Optional<Folder> findFirstByUserIdAndCategory_IdAndNameOrderByCreatedAtAsc(Long userId, Long categoryId, String name);

    Optional<Folder> findFirstByUserIdAndCategory_IdOrderByCreatedAtAsc(Long userId, Long categoryId);

    Optional<Folder> findFirstByUserIdAndCategory_IdAndIdNotOrderByCreatedAtAsc(Long userId, Long categoryId, Long folderId);

    List<Folder> findAllByCategoryIsNull();
}
