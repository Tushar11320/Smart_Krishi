package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.seller.SellerAnalyticsDTO;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.seller.SellerAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller/analytics")
@AllArgsConstructor
@Tag(name = "Seller Analytics", description = "APIs for seller dashboard analytics and metrics")
public class SellerAnalyticsController {

    private final SellerAnalyticsService sellerAnalyticsService;

    @GetMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Get analytics metrics and chart data for the logged-in seller")
    public ResponseEntity<ApiResponse<SellerAnalyticsDTO>> getSellerAnalytics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required to access analytics");
        }
        SellerAnalyticsDTO analytics = sellerAnalyticsService.getSellerAnalytics(userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller analytics retrieved successfully", analytics));
    }
}
