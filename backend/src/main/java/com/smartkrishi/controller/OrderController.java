package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.order.OrderDTO;
import com.smartkrishi.service.order.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.repository.SellerProfileRepository;
import com.smartkrishi.entity.SellerProfile;


@RestController
@RequestMapping("/api/orders")
@AllArgsConstructor
@Tag(name = "Orders", description = "APIs for order management")
public class OrderController {

    private final OrderService orderService;
    private final SellerProfileRepository sellerProfileRepository;


    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new order")
    public ResponseEntity<ApiResponse<OrderDTO>> createOrder(
            @Valid @RequestBody OrderDTO orderDTO,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (!isAdmin(userPrincipal)) {
            orderDTO.setBuyerId(userPrincipal.getId());
        }
        OrderDTO created = orderService.createOrder(orderDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Order created successfully", created), HttpStatus.CREATED);
    }

    @PostMapping("/preview")
    @PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Preview order totals before placing")
    public ResponseEntity<ApiResponse<OrderDTO>> previewOrder(
            @Valid @RequestBody OrderDTO orderDTO,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (!isAdmin(userPrincipal)) {
            orderDTO.setBuyerId(userPrincipal.getId());
        }
        OrderDTO preview = orderService.previewOrder(orderDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order preview calculated successfully", preview));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get all orders (Admin only)")
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getAllOrders(Pageable pageable) {
        Page<OrderDTO> orders = orderService.getAllOrders(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "All orders retrieved successfully", orders));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderDTO order = orderService.getOrderByIdSecure(id, userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order retrieved successfully", order));
    }

    @GetMapping("/buyer/{buyerId}")
    @Operation(summary = "Get all orders for a buyer")
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getBuyerOrders(
            @PathVariable Long buyerId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {
        if (!userPrincipal.getId().equals(buyerId) && !isAdmin(userPrincipal)) {
            throw new AccessDeniedException("Unauthorized access to buyer orders");
        }
        Page<OrderDTO> orders = orderService.getBuyerOrders(buyerId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Orders retrieved successfully", orders));
    }

    @GetMapping("/seller/{sellerId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Get all orders for a seller")
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getSellerOrders(
            @PathVariable Long sellerId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {
        if (!isAdmin(userPrincipal)) {
            SellerProfile seller = sellerProfileRepository.findByUserId(userPrincipal.getId())
                    .orElseThrow(() -> new AccessDeniedException("Seller profile not found"));
            if (!seller.getId().equals(sellerId)) {
                throw new AccessDeniedException("Unauthorized access to seller orders");
            }
        }
        Page<OrderDTO> orders = orderService.getSellerOrders(sellerId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Orders retrieved successfully", orders));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update order status")
    public ResponseEntity<ApiResponse<OrderDTO>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderDTO order = orderService.updateOrderStatusSecure(id, status, userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order status updated successfully", order));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<ApiResponse<OrderDTO>> cancelOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderDTO order = orderService.cancelOrderSecure(id, reason, userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order cancelled successfully", order));
    }

    @PostMapping("/{id}/return")
    @Operation(summary = "Return an order")
    public ResponseEntity<ApiResponse<OrderDTO>> returnOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderDTO order = orderService.returnOrderSecure(id, reason, userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order returned successfully", order));
    }

    @GetMapping("/order-number/{orderNumber}")
    @Operation(summary = "Get order by order number")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderByOrderNumber(
            @PathVariable String orderNumber,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderDTO order = orderService.getOrderByOrderNumber(orderNumber);
        if (!isAdmin(userPrincipal)) {
            if (!order.getBuyerId().equals(userPrincipal.getId()) &&
                (order.getSellerId() == null || !sellerBelongsToUser(order.getSellerId(), userPrincipal.getId()))) {
                throw new AccessDeniedException("You are not authorized to view this order");
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Order retrieved successfully", order));
    }

    private boolean isAdmin(UserPrincipal principal) {
        if (principal == null) return false;
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    private boolean sellerBelongsToUser(Long sellerId, Long userId) {
        return sellerProfileRepository.findById(sellerId)
                .map(s -> s.getUser().getId().equals(userId))
                .orElse(false);
    }
}

