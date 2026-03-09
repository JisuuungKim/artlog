package com.artlog.domain.folder.repository;

import com.artlog.domain.folder.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    /** 특정 유저의 카테고리별 폴더 목록 — categoryId가 null이면 전체 조회 */
    List<Folder> findByUserIdOrderByCreatedAtAsc(Long userId);

    /** 유저의 시스템 폴더('모든 노트') 조회 */
    Optional<Folder> findByUserIdAndIsSystemTrue(Long userId);
}
