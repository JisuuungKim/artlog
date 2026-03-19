package com.artlog.domain.category.repository;

import com.artlog.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByOrderByCreatedAtAsc();

    boolean existsByNameIgnoreCase(String name);

    java.util.Optional<Category> findFirstByNameIgnoreCaseOrderByCreatedAtAsc(String name);
}
