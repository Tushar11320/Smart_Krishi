package com.smartkrishi.repository;

import com.smartkrishi.entity.SubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {
    
    Optional<SubCategory> findBySubcategoryName(String subcategoryName);
    
    java.util.List<SubCategory> findByCategoryId(Long categoryId);
}
