package com.artlog.domain.category.repository;

import com.artlog.domain.category.entity.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {

    boolean existsByUser_IdAndCategory_Id(Long userId, Long categoryId);

    List<UserInterest> findAllByUser_IdOrderByCategory_CreatedAtAsc(Long userId);

    Optional<UserInterest> findByUser_IdAndCategory_Id(Long userId, Long categoryId);
}
