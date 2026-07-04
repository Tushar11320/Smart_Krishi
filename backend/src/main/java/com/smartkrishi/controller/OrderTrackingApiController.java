package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.tracking.OrderTrackingDTO;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.tracking.OrderTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/order-tracking")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
@Tag(name = "Order Tracking API", description = "Endpoints for updating and fetching live order delivery coordinates")
public class OrderTrackingApiController {

    private final OrderTrackingService orderTrackingService;

    @PostMapping("/update")
    @Operation(summary = "Update live delivery vehicle position, speed, and status")
    public ResponseEntity<ApiResponse<OrderTrackingDTO>> updateVehiclePosition(
            @RequestParam("orderId") Long orderId,
            @RequestParam("latitude") BigDecimal latitude,
            @RequestParam("longitude") BigDecimal longitude,
            @RequestParam("speed") Double speed,
            @RequestParam("timestamp") Long timestamp,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        log.info("REST request to update vehicle position for order: {} by user: {}", orderId, userPrincipal.getId());
        OrderTrackingDTO dto = orderTrackingService.updateVehiclePosition(orderId, latitude, longitude, speed, timestamp, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Live tracking position updated successfully", dto));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get current order tracking coordinates and state details")
    public ResponseEntity<ApiResponse<OrderTrackingDTO>> getOrderTrackingStats(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        log.info("REST request to fetch tracking details for order: {}", orderId);
        OrderTrackingDTO dto = orderTrackingService.getTrackingDetails(orderId, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Live tracking coordinates retrieved successfully", dto));
    }
}
