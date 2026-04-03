package com.artlog.domain.song.repository;

import com.artlog.domain.song.entity.UserSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserSongRepository extends JpaRepository<UserSong, Long> {

    @Query("SELECT us FROM UserSong us WHERE us.user.id = :userId" +
           " AND us.category.id = :categoryId" +
           " AND upper(us.title) = upper(:title)")
    Optional<UserSong> findByUserIdAndCategoryIdAndTitleIgnoreCase(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("title") String title
    );

    /** 특정 유저의 카테고리별 노래 목록(해당 카테고리에 노트가 있는 곡) */
    @Query("SELECT us FROM UserSong us" +
           " WHERE us.user.id = :userId" +
           " AND (:categoryId IS NULL OR us.category.id = :categoryId)" +
           " ORDER BY us.createdAt DESC")
    List<UserSong> findByUserIdAndCategoryId(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId
    );

    @Query("SELECT us FROM UserSong us" +
           " WHERE us.user.id = :userId" +
           " AND us.category.id IN :categoryIds" +
           " ORDER BY us.createdAt DESC")
    List<UserSong> findByUserIdAndCategoryIds(
            @Param("userId") Long userId,
            @Param("categoryIds") List<Long> categoryIds
    );

    /** 소유자 확인용 단건 조회 */
    Optional<UserSong> findByIdAndUserId(Long id, Long userId);

    List<UserSong> findAllByCategoryIsNull();
}
