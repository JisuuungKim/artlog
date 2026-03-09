package com.artlog.domain.song.repository;

import com.artlog.domain.song.entity.UserSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserSongRepository extends JpaRepository<UserSong, Long> {

    /** 특정 유저의 카테고리별 노래 목록(해당 카테고리에 노트가 있는 곡) */
    @Query("SELECT DISTINCT nst.userSong FROM NoteSongTag nst" +
           " WHERE nst.note.user.id = :userId" +
           " AND (:categoryId IS NULL OR nst.note.category.id = :categoryId)" +
           " ORDER BY nst.userSong.createdAt DESC")
    List<UserSong> findByUserIdAndCategoryId(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId
    );

    /** 소유자 확인용 단건 조회 */
    Optional<UserSong> findByIdAndUserId(Long id, Long userId);
}
