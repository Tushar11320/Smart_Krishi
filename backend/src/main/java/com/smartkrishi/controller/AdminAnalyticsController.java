package com.smartkrishi.controller;

import com.smartkrishi.dto.admin.CommissionAnalyticsDTO;
import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.service.admin.AdminAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartkrishi.dto.admin.AdminDashboardStatsDTO;
import com.smartkrishi.dto.admin.FraudAlertDTO;
import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@AllArgsConstructor
@Tag(name = "Admin Analytics", description = "APIs for administrator dashboard analytics")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/commission")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get platform commission analytics")
    public ResponseEntity<ApiResponse<CommissionAnalyticsDTO>> getCommissionAnalytics() {
        CommissionAnalyticsDTO dto = adminAnalyticsService.getCommissionAnalytics();
        return ResponseEntity.ok(new ApiResponse<>(true, "Commission analytics retrieved successfully", dto));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin dashboard overview statistics")
    public ResponseEntity<ApiResponse<AdminDashboardStatsDTO>> getAdminDashboardStats() {
        AdminDashboardStatsDTO stats = adminAnalyticsService.getAdminDashboardStats();
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard stats retrieved successfully", stats));
    }

    @GetMapping("/fraud/alerts")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get active security and fraud warnings")
    public ResponseEntity<ApiResponse<List<FraudAlertDTO>>> getFraudAlerts() {
        List<FraudAlertDTO> alerts = adminAnalyticsService.getFraudAlerts();
        return ResponseEntity.ok(new ApiResponse<>(true, "Fraud alerts retrieved successfully", alerts));
    }
}
