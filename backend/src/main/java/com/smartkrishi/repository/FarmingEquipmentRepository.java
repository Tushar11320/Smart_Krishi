package com.smartkrishi.repository;

import com.smartkrishi.entity.FarmingEquipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface FarmingEquipmentRepository extends JpaRepository<FarmingEquipment, Long> {

    Optional<FarmingEquipment> findByProductId(Long productId);

    @Query("SELECT fe FROM FarmingEquipment fe JOIN fe.product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(fe.equipmentName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(fe.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(fe.model) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.productDescription) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:brand IS NULL OR :brand = '' OR LOWER(fe.brand) = LOWER(:brand)) AND " +
           "(:condition IS NULL OR :condition = '' OR LOWER(fe.equipmentCondition) = LOWER(:condition)) AND " +
           "(:forSale IS NULL OR fe.forSale = :forSale) AND " +
           "(:forRent IS NULL OR fe.forRent = :forRent) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "p.deletedAt IS NULL AND p.productStatus = 'ACTIVE'")
    Page<FarmingEquipment> filterEquipment(
        @Param("keyword") String keyword,
        @Param("brand") String brand,
        @Param("condition") String condition,
        @Param("forSale") Boolean forSale,
        @Param("forRent") Boolean forRent,
        @Param("maxPrice") BigDecimal maxPrice,
        Pageable pageable
    );
}
