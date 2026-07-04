package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.wishlist.WishlistDTO;
import com.smartkrishi.service.wishlist.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@AllArgsConstructor
@Tag(name = "Wishlist", description = "APIs for wishlist management")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping("/{userId}")
    @Operation(summary = "Get user wishlist")
    public ResponseEntity<ApiResponse<Page<WishlistDTO>>> getWishlist(
            @PathVariable Long userId,
            Pageable pageable) {
        Page<WishlistDTO> wishlist = wishlistService.getWishlist(userId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Wishlist retrieved successfully", wishlist));
    }

    @PostMapping("/{userId}/products/{productId}")
    @Operation(summary = "Add product to wishlist")
    public ResponseEntity<ApiResponse<WishlistDTO>> addToWishlist(
            @PathVariable Long userId,
            @PathVariable Long productId) {
        WishlistDTO wishlist = wishlistService.addToWishlist(userId, productId);
        return new ResponseEntity<>(new ApiResponse<>(true, "Product added to wishlist", wishlist), HttpStatus.CREATED);
    }

    @DeleteMapping("/{userId}/products/{productId}")
    @Operation(summary = "Remove product from wishlist")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @PathVariable Long userId,
            @PathVariable Long productId) {
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product removed from wishlist", null));
    }

    @GetMapping("/{userId}/products/{productId}/exists")
    @Operation(summary = "Check if product is in wishlist")
    public ResponseEntity<ApiResponse<Boolean>> isInWishlist(
            @PathVariable Long userId,
            @PathVariable Long productId) {
        boolean exists = wishlistService.isInWishlist(userId, productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Check completed", exists));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Clear wishlist")
    public ResponseEntity<ApiResponse<Void>> clearWishlist(@PathVariable Long userId) {
        wishlistService.clearWishlist(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Wishlist cleared successfully", null));
    }
}
