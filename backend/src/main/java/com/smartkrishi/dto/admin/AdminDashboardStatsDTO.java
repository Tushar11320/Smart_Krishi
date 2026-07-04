package com.smartkrishi.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardStatsDTO {
    private Long totalUsers;
    private Long totalSellers;
    private Long pendingSellers;
    
    private Long totalProducts;
    private Long activeProducts;
    
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal totalCommission;
    private Integer activeFraudAlerts;
    
    // Distribution mappings
    private Map<String, Long> productCategoryDistribution;
    private Map<String, Long> orderStatusDistribution;
    
    // Growth metrics (Month/Date -> value)
    private Map<String, BigDecimal> monthlyCommissionTrend;
    private Map<String, Long> monthlyUserRegistrationTrend;
    private Map<String, Long> monthlyOrderVolumeTrend;

    // Feedback and Ratings insights
    private Long totalFeedbacks;
    private Long pendingFeedbacks;
    private Map<String, Long> feedbackCategoryDistribution;
    private Map<String, Long> feedbackStatusDistribution;
    private Map<String, Long> feedbackPriorityDistribution;
    private Map<String, Double> topRatedSellers;
    private Map<String, Double> lowRatedProducts;
}
