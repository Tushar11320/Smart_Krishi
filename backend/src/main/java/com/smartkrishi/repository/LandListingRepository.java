package com.smartkrishi.repository;

import com.smartkrishi.entity.LandListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface LandListingRepository extends JpaRepository<LandListing, Long> {
    
    Page<LandListing> findBySellerId(Long sellerId, Pageable pageable);
    
    Page<LandListing> findByLandStatus(LandListing.LandStatus status, Pageable pageable);
    
    Page<LandListing> findByStateContainingIgnoreCase(String state, Pageable pageable);
    
    Page<LandListing> findByStateContainingIgnoreCaseAndDistrictContainingIgnoreCase(String state, String district, Pageable pageable);
    
    @Query("SELECT l FROM LandListing l WHERE " +
           "(:state IS NULL OR LOWER(l.state) LIKE LOWER(CONCAT('%', :state, '%'))) AND " +
           "(:district IS NULL OR LOWER(l.district) LIKE LOWER(CONCAT('%', :district, '%'))) AND " +
           "(:landType IS NULL OR LOWER(l.landType) LIKE LOWER(CONCAT('%', :landType, '%')))")
    Page<LandListing> searchByLocation(String state, String district, String landType, Pageable pageable);

    @Query("SELECT l FROM LandListing l WHERE " +
           "(:state IS NULL OR LOWER(l.state) LIKE LOWER(CONCAT('%', :state, '%'))) AND " +
           "(:district IS NULL OR LOWER(l.district) LIKE LOWER(CONCAT('%', :district, '%'))) AND " +
           "(:landType IS NULL OR LOWER(l.landType) LIKE LOWER(CONCAT('%', :landType, '%'))) AND " +
           "(:soilType IS NULL OR LOWER(l.soilInformation) LIKE LOWER(CONCAT('%', :soilType, '%'))) AND " +
           "(:waterSource IS NULL OR LOWER(l.waterSourceInformation) LIKE LOWER(CONCAT('%', :waterSource, '%'))) AND " +
           "(:electricity IS NULL OR l.electricityAvailability = :electricity) AND " +
           "(:roadConnectivity IS NULL OR LOWER(l.roadConnectivity) LIKE LOWER(CONCAT('%', :roadConnectivity, '%'))) AND " +
           "(:minPrice IS NULL OR l.pricePerAcre >= :minPrice) AND " +
           "(:maxPrice IS NULL OR l.pricePerAcre <= :maxPrice) AND " +
           "(l.landStatus = com.smartkrishi.entity.LandListing.LandStatus.AVAILABLE)")
    Page<LandListing> searchLandListings(
            String state, String district, String landType, String soilType, String waterSource,
            Boolean electricity, String roadConnectivity, BigDecimal minPrice, BigDecimal maxPrice,
            Pageable pageable);
    
    Page<LandListing> findByPricePerAcreBetween(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
    
    @Modifying
    @Query("UPDATE LandListing l SET l.viewCount = l.viewCount + 1 WHERE l.id = :id")
    void incrementViewCount(Long id);
    
    @Modifying
    @Query("UPDATE LandListing l SET l.interestCount = l.interestCount + 1 WHERE l.id = :id")
    void incrementInterestCount(Long id);
}
