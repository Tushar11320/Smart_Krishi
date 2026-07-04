package com.smartkrishi.repository;

import com.smartkrishi.entity.Milk;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MilkRepository extends JpaRepository<Milk, Long> {
    
    Optional<Milk> findByProductId(Long productId);
    
    List<Milk> findByMilkType(String milkType);
    
    Page<Milk> findByMilkTypeContainingIgnoreCase(String milkType, Pageable pageable);
    
    @Query("SELECT m FROM Milk m JOIN m.product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.productDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:milkType IS NULL OR :milkType = '' OR LOWER(m.milkType) = LOWER(:milkType)) AND " +
           "(:minFat IS NULL OR m.fatPercentage >= :minFat) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "p.deletedAt IS NULL AND p.productStatus = 'ACTIVE'")
    Page<Milk> filterMilk(
        @Param("keyword") String keyword,
        @Param("milkType") String milkType,
        @Param("minFat") Double minFat,
        @Param("maxPrice") java.math.BigDecimal maxPrice,
        Pageable pageable
    );
}
