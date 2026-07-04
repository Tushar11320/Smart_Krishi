package com.smartkrishi.repository;

import com.smartkrishi.entity.BuildingMaterial;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface BuildingMaterialRepository extends JpaRepository<BuildingMaterial, Long> {
    
    Optional<BuildingMaterial> findByProductId(Long productId);
    
    @Query("SELECT bm FROM BuildingMaterial bm JOIN bm.product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(bm.materialType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.productDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:materialType IS NULL OR :materialType = '' OR LOWER(bm.materialType) = LOWER(:materialType)) AND " +
           "(:deliveryAvailable IS NULL OR bm.deliveryAvailable = :deliveryAvailable) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "p.deletedAt IS NULL AND p.productStatus = 'ACTIVE'")
    Page<BuildingMaterial> filterMaterials(
        @Param("keyword") String keyword,
        @Param("materialType") String materialType,
        @Param("deliveryAvailable") Boolean deliveryAvailable,
        @Param("maxPrice") BigDecimal maxPrice,
        Pageable pageable
    );
}
