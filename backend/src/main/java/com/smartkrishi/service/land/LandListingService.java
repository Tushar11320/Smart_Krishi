package com.smartkrishi.service.land;

import com.smartkrishi.dto.land.LandListingDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface LandListingService {
    LandListingDTO createLandListing(LandListingDTO landListingDTO);
    LandListingDTO getLandListingById(Long id);
    Page<LandListingDTO> getAllLandListings(Pageable pageable);
    Page<LandListingDTO> getLandListingsBySeller(Long sellerId, Pageable pageable);
    Page<LandListingDTO> searchByLocation(String state, String district, String landType, Pageable pageable);
    Page<LandListingDTO> searchLandListings(
            String state, String district, String landType, String soilType, String waterSource,
            Boolean electricity, String roadConnectivity, BigDecimal minPrice, BigDecimal maxPrice,
            Pageable pageable);
    Page<LandListingDTO> getLandListingsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
    Page<LandListingDTO> getLandListingsByStatus(String status, Pageable pageable);
    LandListingDTO updateLandListing(Long id, LandListingDTO landListingDTO);
    LandListingDTO updateLandListingStatus(Long id, String status);
    void incrementViewCount(Long id);
    void incrementInterestCount(Long id);
    void deleteLandListing(Long id);
}
