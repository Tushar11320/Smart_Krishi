package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.tracking.OrderTrackingDTO;
import com.smartkrishi.entity.TrackingAuditLog;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.tracking.OrderTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@AllArgsConstructor
@Tag(name = "Order Tracking", description = "APIs for live order tracking and delivery status")
public class OrderTrackingController {

    private final OrderTrackingService orderTrackingService;

    @GetMapping("/{orderId}/tracking")
    @Operation(summary = "Get tracking details for an order")
    public ResponseEntity<ApiResponse<OrderTrackingDTO>> getTracking(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderTrackingDTO tracking = orderTrackingService.getTrackingDetails(orderId, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Tracking details retrieved", tracking));
    }

    @PostMapping("/{orderId}/tracking/assign")
    @Operation(summary = "Assign a delivery partner to an order")
    public ResponseEntity<ApiResponse<OrderTrackingDTO>> assignDriver(
            @PathVariable Long orderId,
            @RequestParam Long deliveryUserId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderTrackingDTO tracking = orderTrackingService.assignDeliveryPartner(orderId, deliveryUserId, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Delivery partner assigned successfully", tracking));
    }

    @PostMapping("/{orderId}/tracking/location")
    @Operation(summary = "Update current location coordinates of delivery partner")
    public ResponseEntity<ApiResponse<OrderTrackingDTO>> updateLocation(
            @PathVariable Long orderId,
            @RequestParam BigDecimal latitude,
            @RequestParam BigDecimal longitude,
            @RequestParam(required = false) Integer etaMinutes,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderTrackingDTO tracking = orderTrackingService.updateLocation(orderId, latitude, longitude, etaMinutes, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Location updated successfully", tracking));
    }

    @PostMapping("/{orderId}/tracking/status")
    @Operation(summary = "Update tracking status of an order")
    public ResponseEntity<ApiResponse<OrderTrackingDTO>> updateStatus(
            @PathVariable Long orderId,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        OrderTrackingDTO tracking = orderTrackingService.updateStatus(orderId, status, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Status updated successfully", tracking));
    }

    @GetMapping("/{orderId}/tracking/logs")
    @Operation(summary = "Get audit logs for tracking an order")
    public ResponseEntity<ApiResponse<List<TrackingAuditLog>>> getAuditLogs(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<TrackingAuditLog> logs = orderTrackingService.getAuditLogs(orderId, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Audit logs retrieved", logs));
    }
}
