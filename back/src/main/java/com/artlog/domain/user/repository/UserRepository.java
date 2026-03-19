package com.artlog.domain.user.repository;

import com.artlog.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByProviderAndSocialId(String provider, String socialId);

    Optional<User> findFirstByEmailIgnoreCaseAndIsDeletedFalse(String email);

    Optional<User> findByIdAndIsDeletedFalse(Long id);

    List<User> findAllByIsDeletedFalseOrderByIdAsc();
}
