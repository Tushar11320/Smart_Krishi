package com.smartkrishi.repository;

import com.smartkrishi.entity.ProductInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductInventoryRepository extends JpaRepository<ProductInventory, Long> {
    
    Optional<ProductInventory> findByProductId(Long productId);
}
