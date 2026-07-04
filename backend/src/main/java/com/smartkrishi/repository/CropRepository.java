package com.smartkrishi.repository;

import com.smartkrishi.entity.Crop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropRepository extends JpaRepository<Crop, Long> {
    
    Optional<Crop> findByProductId(Long productId);
    
    List<Crop> findByCropType(String cropType);
    
    Page<Crop> findByCropTypeContainingIgnoreCase(String cropType, Pageable pageable);
    
    List<Crop> findByGrowingSeason(String growingSeason);
    
    Page<Crop> findByGrowingSeasonContainingIgnoreCase(String growingSeason, Pageable pageable);
    
    @Query("SELECT c FROM Crop c WHERE c.cropName LIKE %:keyword% OR c.scientificName LIKE %:keyword%")
    List<Crop> searchByKeyword(String keyword);

    @Query("SELECT c FROM Crop c JOIN c.product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(c.cropName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.variety) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.productDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:state IS NULL OR :state = '' OR LOWER(c.location) = LOWER(:state)) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "p.deletedAt IS NULL AND p.productStatus = 'ACTIVE'")
    Page<Crop> filterCrops(
        @org.springframework.data.repository.query.Param("keyword") String keyword,
        @org.springframework.data.repository.query.Param("state") String state,
        @org.springframework.data.repository.query.Param("minPrice") java.math.BigDecimal minPrice,
        @org.springframework.data.repository.query.Param("maxPrice") java.math.BigDecimal maxPrice,
        Pageable pageable
    );
}
