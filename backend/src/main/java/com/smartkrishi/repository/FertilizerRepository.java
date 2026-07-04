package com.smartkrishi.repository;

import com.smartkrishi.entity.Fertilizer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FertilizerRepository extends JpaRepository<Fertilizer, Long> {
    
    Optional<Fertilizer> findByProductId(Long productId);
    
    List<Fertilizer> findByBrand(String brand);
    
    Page<Fertilizer> findByBrandContainingIgnoreCase(String brand, Pageable pageable);
    
    @Query("SELECT f FROM Fertilizer f JOIN f.product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(f.fertilizerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(f.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.productDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:brand IS NULL OR :brand = '' OR LOWER(f.brand) = LOWER(:brand)) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "p.deletedAt IS NULL AND p.productStatus = 'ACTIVE'")
    Page<Fertilizer> filterFertilizers(
        @Param("keyword") String keyword,
        @Param("brand") String brand,
        @Param("maxPrice") java.math.BigDecimal maxPrice,
        Pageable pageable
    );
}
