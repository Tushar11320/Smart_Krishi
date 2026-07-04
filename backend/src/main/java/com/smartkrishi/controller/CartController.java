package com.smartkrishi.controller;

import com.smartkrishi.dto.cart.CartDTO;
import com.smartkrishi.dto.cart.CartItemDTO;
import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.service.cart.CartService;
import com.smartkrishi.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@AllArgsConstructor
@Tag(name = "Shopping Cart", description = "APIs for shopping cart management")
public class CartController {

    private final CartService cartService;

    @GetMapping("/{userId}")
    @Operation(summary = "Get user cart")
    public ResponseEntity<ApiResponse<CartDTO>> getCart(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateCartAccess(userId, userPrincipal);
        CartDTO cart = cartService.getCart(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cart retrieved successfully", cart));
    }

    @PostMapping("/{userId}/items")
    @Operation(summary = "Add item to cart")
    public ResponseEntity<ApiResponse<CartDTO>> addToCart(
            @PathVariable Long userId,
            @Valid @RequestBody CartItemDTO cartItemDTO,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateCartAccess(userId, userPrincipal);
        CartDTO cart = cartService.addToCart(userId, cartItemDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Item added to cart", cart), HttpStatus.CREATED);
    }

    @PutMapping("/{userId}/items/{cartItemId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<ApiResponse<CartDTO>> updateCartItem(
            @PathVariable Long userId,
            @PathVariable Long cartItemId,
            @RequestParam Integer quantity,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateCartAccess(userId, userPrincipal);
        CartDTO cart = cartService.updateCartItem(userId, cartItemId, quantity);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cart item updated", cart));
    }

    @DeleteMapping("/{userId}/items/{cartItemId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<ApiResponse<Void>> removeFromCart(
            @PathVariable Long userId,
            @PathVariable Long cartItemId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateCartAccess(userId, userPrincipal);
        cartService.removeFromCart(userId, cartItemId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Item removed from cart", null));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Clear cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateCartAccess(userId, userPrincipal);
        cartService.clearCart(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cart cleared successfully", null));
    }

    @PutMapping("/{userId}/items/{cartItemId}/save-for-later")
    @Operation(summary = "Toggle save for later for a cart item")
    public ResponseEntity<ApiResponse<CartDTO>> toggleSaveForLater(
            @PathVariable Long userId,
            @PathVariable Long cartItemId,
            @RequestParam boolean save,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateCartAccess(userId, userPrincipal);
        CartDTO cart = cartService.toggleSaveForLater(userId, cartItemId, save);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cart item status updated", cart));
    }

    @PostMapping("/{userId}/merge")
    @Operation(summary = "Merge guest cart with user cart")
    public ResponseEntity<ApiResponse<CartDTO>> mergeCart(
            @PathVariable Long userId,
            @Valid @RequestBody CartDTO guestCart,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        validateCartAccess(userId, userPrincipal);
        CartDTO cart = cartService.mergeCart(userId, guestCart);
        return ResponseEntity.ok(new ApiResponse<>(true, "Carts merged successfully", cart));
    }

    private void validateCartAccess(Long userId, UserPrincipal userPrincipal) {
        if (userPrincipal == null || (!userPrincipal.getId().equals(userId) && !isAdmin(userPrincipal))) {
            throw new AccessDeniedException("Unauthorized access to cart details");
        }
    }

    private boolean isAdmin(UserPrincipal principal) {
        if (principal == null) return false;
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
