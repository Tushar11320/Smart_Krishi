package com.smartkrishi.repository;

import com.smartkrishi.entity.Machinery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineryRepository extends JpaRepository<Machinery, Long> {
    
    Optional<Machinery> findByProductId(Long productId);
    
    List<Machinery> findByMachineryType(String machineryType);
    
    Page<Machinery> findByMachineryTypeContainingIgnoreCase(String machineryType, Pageable pageable);
    
    List<Machinery> findByBrandName(String brandName);
    
    Page<Machinery> findByBrandNameContainingIgnoreCase(String brandName, Pageable pageable);
    
    @Query("SELECT m FROM Machinery m WHERE m.brandName LIKE %:keyword% OR m.modelNumber LIKE %:keyword%")
    List<Machinery> searchByKeyword(String keyword);
}
