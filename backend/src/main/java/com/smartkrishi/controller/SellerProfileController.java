package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.seller.SellerProfileDTO;
import com.smartkrishi.service.seller.SellerProfileService;
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

@RestController
@RequestMapping("/api/sellers")
@AllArgsConstructor
@Tag(name = "Seller Profiles", description = "APIs for seller profile management")
public class SellerProfileController {

    private final SellerProfileService sellerProfileService;

    @PostMapping
    @PreAuthorize("hasRole('BUYER') or hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create seller profile")
    public ResponseEntity<ApiResponse<SellerProfileDTO>> createSellerProfile(@Valid @RequestBody SellerProfileDTO sellerProfileDTO) {
        SellerProfileDTO created = sellerProfileService.createSellerProfile(sellerProfileDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Seller profile created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get seller profile by ID")
    public ResponseEntity<ApiResponse<SellerProfileDTO>> getSellerProfileById(@PathVariable Long id) {
        SellerProfileDTO sellerProfile = sellerProfileService.getSellerProfileById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller profile retrieved successfully", sellerProfile));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get seller profile by user ID")
    public ResponseEntity<ApiResponse<SellerProfileDTO>> getSellerProfileByUserId(@PathVariable Long userId) {
        SellerProfileDTO sellerProfile = sellerProfileService.getSellerProfileByUserId(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller profile retrieved successfully", sellerProfile));
    }

    @GetMapping
    @Operation(summary = "Get all seller profiles")
    public ResponseEntity<ApiResponse<Page<SellerProfileDTO>>> getAllSellerProfiles(Pageable pageable) {
        Page<SellerProfileDTO> sellerProfiles = sellerProfileService.getAllSellerProfiles(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller profiles retrieved successfully", sellerProfiles));
    }

    @GetMapping("/verified")
    @Operation(summary = "Get verified seller profiles")
    public ResponseEntity<ApiResponse<Page<SellerProfileDTO>>> getVerifiedSellers(Pageable pageable) {
        Page<SellerProfileDTO> sellerProfiles = sellerProfileService.getVerifiedSellers(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Verified sellers retrieved successfully", sellerProfiles));
    }

    @GetMapping("/top-rated")
    @Operation(summary = "Get top-rated seller profiles")
    public ResponseEntity<ApiResponse<Page<SellerProfileDTO>>> getTopRatedSellers(Pageable pageable) {
        Page<SellerProfileDTO> sellerProfiles = sellerProfileService.getTopRatedSellers(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Top-rated sellers retrieved successfully", sellerProfiles));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update seller profile")
    public ResponseEntity<ApiResponse<SellerProfileDTO>> updateSellerProfile(
            @PathVariable Long id,
            @Valid @RequestBody SellerProfileDTO sellerProfileDTO) {
        SellerProfileDTO updated = sellerProfileService.updateSellerProfile(id, sellerProfileDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller profile updated successfully", updated));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve seller profile")
    public ResponseEntity<ApiResponse<SellerProfileDTO>> approveSellerProfile(@PathVariable Long id) {
        SellerProfileDTO sellerProfile = sellerProfileService.approveSellerProfile(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller profile approved successfully", sellerProfile));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject seller profile")
    public ResponseEntity<ApiResponse<SellerProfileDTO>> rejectSellerProfile(
            @PathVariable Long id,
            @RequestParam String reason) {
        SellerProfileDTO sellerProfile = sellerProfileService.rejectSellerProfile(id, reason);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller profile rejected successfully", sellerProfile));
    }

    @PutMapping("/onboarding")
    @PreAuthorize("hasRole('BUYER') or hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Submit seller onboarding details")
    public ResponseEntity<ApiResponse<SellerProfileDTO>> submitOnboarding(
            @Valid @RequestBody SellerProfileDTO onboardingDTO) {
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        SellerProfileDTO updated = sellerProfileService.submitOnboarding(principal.getId(), onboardingDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller onboarding submitted successfully", updated));
    }

    @PutMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Suspend seller profile")
    public ResponseEntity<ApiResponse<SellerProfileDTO>> suspendSellerProfile(
            @PathVariable Long id,
            @RequestParam String reason) {
        SellerProfileDTO sellerProfile = sellerProfileService.suspendSellerProfile(id, reason);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller profile suspended successfully", sellerProfile));
    }

    @GetMapping("/{id}/dashboard-stats")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Get seller dashboard statistics")
    public ResponseEntity<ApiResponse<com.smartkrishi.dto.seller.SellerDashboardStatsDTO>> getSellerDashboardStats(@PathVariable Long id) {
        com.smartkrishi.dto.seller.SellerDashboardStatsDTO stats = sellerProfileService.getDashboardStats(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller dashboard statistics retrieved successfully", stats));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete seller profile")
    public ResponseEntity<ApiResponse<Void>> deleteSellerProfile(@PathVariable Long id) {
        sellerProfileService.deleteSellerProfile(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller profile deleted successfully", null));
    }
}
