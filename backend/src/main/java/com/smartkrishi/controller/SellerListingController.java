package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.product.ProductDTO;
import com.smartkrishi.dto.land.LandListingDTO;
import com.smartkrishi.dto.seller.BulkUpdateStatusRequest;
import com.smartkrishi.dto.seller.BulkUpdateStockRequest;
import com.smartkrishi.dto.seller.SellerInventoryStatsDTO;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.seller.SellerListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/listings")
@AllArgsConstructor
@PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
@Tag(name = "Seller Listings Management", description = "APIs for seller product and stock listing controls")
public class SellerListingController {

    private final SellerListingService sellerListingService;

    @GetMapping("/stats")
    @Operation(summary = "Get current seller inventory counts and alerts summary")
    public ResponseEntity<ApiResponse<SellerInventoryStatsDTO>> getStats(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        SellerInventoryStatsDTO stats = sellerListingService.getSellerInventoryStats(userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Inventory stats retrieved successfully", stats));
    }

    @PatchMapping("/products/{id}/status")
    @Operation(summary = "Toggle a product status (ACTIVE or INACTIVE)")
    public ResponseEntity<ApiResponse<ProductDTO>> toggleProductStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        ProductDTO updated = sellerListingService.toggleProductStatus(id, status, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Product status updated", updated));
    }

    @PatchMapping("/products/{id}/stock")
    @Operation(summary = "Direct edit of product inventory stock count")
    public ResponseEntity<ApiResponse<ProductDTO>> updateProductStock(
            @PathVariable Long id,
            @RequestParam(required = false) Integer quantity,
            @RequestParam(required = false) Integer reorderLevel,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        ProductDTO updated = sellerListingService.updateProductStock(id, quantity, reorderLevel, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Stock levels updated", updated));
    }

    @PostMapping("/products/bulk-status")
    @Operation(summary = "Bulk status change for a list of products")
    public ResponseEntity<ApiResponse<Void>> bulkUpdateStatus(
            @RequestBody BulkUpdateStatusRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        sellerListingService.bulkUpdateStatus(request.getIds(), request.getStatus(), userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Bulk status updated successfully", null));
    }

    @PostMapping("/products/bulk-stock")
    @Operation(summary = "Bulk stock quantity updates for a list of products")
    public ResponseEntity<ApiResponse<Void>> bulkUpdateStock(
            @RequestBody BulkUpdateStockRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        sellerListingService.bulkUpdateStock(request.getIds(), request.getQuantity(), userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Bulk stock updated successfully", null));
    }

    @PatchMapping("/lands/{id}/status")
    @Operation(summary = "Toggle a land listing status (AVAILABLE or DELISTED)")
    public ResponseEntity<ApiResponse<LandListingDTO>> toggleLandStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        LandListingDTO updated = sellerListingService.toggleLandStatus(id, status, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Land status updated", updated));
    }

    @PostMapping("/lands/bulk-status")
    @Operation(summary = "Bulk status change for a list of land listings")
    public ResponseEntity<ApiResponse<Void>> bulkUpdateLandStatus(
            @RequestBody BulkUpdateStatusRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        sellerListingService.bulkUpdateLandStatus(request.getIds(), request.getStatus(), userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Bulk land status updated successfully", null));
    }
}
