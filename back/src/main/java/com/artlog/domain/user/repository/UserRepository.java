package com.artlog.domain.user.repository;

import com.artlog.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySocialIdAndProvider(String socialId, String provider);

    Optional<User> findByIdAndIsDeletedFalse(Long id);
}
