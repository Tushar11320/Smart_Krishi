package com.smartkrishi.repository;

import com.smartkrishi.entity.ProductSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductSpecificationRepository extends JpaRepository<ProductSpecification, Long> {
    
    List<ProductSpecification> findByProductId(Long productId);
    
    List<ProductSpecification> findByProductIdOrderByDisplayOrder(Long productId);
    
    void deleteByProductId(Long productId);
}
