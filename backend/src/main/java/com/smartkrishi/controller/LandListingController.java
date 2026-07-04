package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.land.LandListingDTO;
import com.smartkrishi.service.land.LandListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/land-listings")
@AllArgsConstructor
@Tag(name = "Land Listings", description = "APIs for land listing management")
public class LandListingController {

    private final LandListingService landListingService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new land listing")
    public ResponseEntity<ApiResponse<LandListingDTO>> createLandListing(@Valid @RequestBody LandListingDTO landListingDTO) {
        LandListingDTO created = landListingService.createLandListing(landListingDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Land listing created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get land listing by ID")
    public ResponseEntity<ApiResponse<LandListingDTO>> getLandListingById(@PathVariable Long id) {
        LandListingDTO landListing = landListingService.getLandListingById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listing retrieved successfully", landListing));
    }

    @GetMapping
    @Operation(summary = "Get all land listings with pagination")
    public ResponseEntity<ApiResponse<Page<LandListingDTO>>> getAllLandListings(Pageable pageable) {
        Page<LandListingDTO> listings = landListingService.getAllLandListings(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listings retrieved successfully", listings));
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "Get land listings by seller")
    public ResponseEntity<ApiResponse<Page<LandListingDTO>>> getLandListingsBySeller(
            @PathVariable Long sellerId,
            Pageable pageable) {
        Page<LandListingDTO> listings = landListingService.getLandListingsBySeller(sellerId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listings retrieved successfully", listings));
    }

    @GetMapping("/search")
    @Operation(summary = "Search land listings by location")
    public ResponseEntity<ApiResponse<Page<LandListingDTO>>> searchByLocation(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String landType,
            Pageable pageable) {
        Page<LandListingDTO> listings = landListingService.searchByLocation(state, district, landType, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listings retrieved successfully", listings));
    }

    @GetMapping("/search-all")
    @Operation(summary = "Advanced search of land listings with filters")
    public ResponseEntity<ApiResponse<Page<LandListingDTO>>> searchLandListings(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String landType,
            @RequestParam(required = false) String soilType,
            @RequestParam(required = false) String waterSource,
            @RequestParam(required = false) Boolean electricity,
            @RequestParam(required = false) String roadConnectivity,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            Pageable pageable) {
        Page<LandListingDTO> listings = landListingService.searchLandListings(
                state, district, landType, soilType, waterSource,
                electricity, roadConnectivity, minPrice, maxPrice, pageable
        );
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listings retrieved successfully", listings));
    }

    @GetMapping("/price-range")
    @Operation(summary = "Get land listings by price range")
    public ResponseEntity<ApiResponse<Page<LandListingDTO>>> getLandListingsByPriceRange(
            @RequestParam BigDecimal minPrice,
            @RequestParam BigDecimal maxPrice,
            Pageable pageable) {
        Page<LandListingDTO> listings = landListingService.getLandListingsByPriceRange(minPrice, maxPrice, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listings retrieved successfully", listings));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get land listings by status")
    public ResponseEntity<ApiResponse<Page<LandListingDTO>>> getLandListingsByStatus(
            @PathVariable String status,
            Pageable pageable) {
        Page<LandListingDTO> listings = landListingService.getLandListingsByStatus(status, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listings retrieved successfully", listings));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update land listing")
    public ResponseEntity<ApiResponse<LandListingDTO>> updateLandListing(
            @PathVariable Long id,
            @Valid @RequestBody LandListingDTO landListingDTO) {
        LandListingDTO updated = landListingService.updateLandListing(id, landListingDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listing updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update land listing status")
    public ResponseEntity<ApiResponse<LandListingDTO>> updateLandListingStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        LandListingDTO updated = landListingService.updateLandListingStatus(id, status);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listing status updated successfully", updated));
    }

    @PostMapping("/{id}/increment-view")
    @Operation(summary = "Increment view count")
    public ResponseEntity<ApiResponse<Void>> incrementViewCount(@PathVariable Long id) {
        landListingService.incrementViewCount(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "View count incremented", null));
    }

    @PostMapping("/{id}/increment-interest")
    @Operation(summary = "Increment interest count")
    public ResponseEntity<ApiResponse<Void>> incrementInterestCount(@PathVariable Long id) {
        landListingService.incrementInterestCount(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Interest count incremented", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Delete land listing")
    public ResponseEntity<ApiResponse<Void>> deleteLandListing(@PathVariable Long id) {
        landListingService.deleteLandListing(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Land listing deleted successfully", null));
    }
}
