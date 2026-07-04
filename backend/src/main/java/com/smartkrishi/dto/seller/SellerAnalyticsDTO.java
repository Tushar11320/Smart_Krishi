package com.smartkrishi.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerAnalyticsDTO {
    
    // Overview Metrics
    private BigDecimal totalRevenue;
    private BigDecimal netRevenue; // revenue minus platform fees
    private Long totalOrders;
    private Long pendingOrders;
    private Long deliveredOrders;
    private Long cancelledOrders;
    
    // Repeat Customers
    private Long totalCustomers;
    private Long repeatCustomers;
    private Double repeatCustomerRate; // percentage
    
    // Conversion Rates
    private Double conversionRate; // percentage: (totalSold / totalViews)
    private Long totalViews;
    private Long totalPurchases;
    
    // Inventory Health
    private Long totalProducts;
    private Long activeProducts;
    private Long outOfStockProducts;
    private Long lowStockProducts; // quantityAvailable <= reorderLevel
    
    // Top Products
    private List<TopProductDTO> topProducts;
    
    // Chart Data
    private List<ChartDataPointDTO> dailyChart;
    private List<ChartDataPointDTO> weeklyChart;
    private List<ChartDataPointDTO> monthlyChart;
    private List<ChartDataPointDTO> yearlyChart;

    // Review & Ratings Analytics
    private BigDecimal averageRating;
    private Long totalReviews;
    private Double customerSatisfactionScore; // Percentage of 4-5 stars
    private java.util.Map<Integer, Long> ratingDistribution; // 1 to 5 star distribution
    private Double deliveryExperienceAvg;
    private Double productQualityAvg;
    private Double communicationAvg;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProductDTO {
        private Long id;
        private String productName;
        private String sku;
        private BigDecimal price;
        private Integer quantitySold;
        private BigDecimal totalRevenue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChartDataPointDTO {
        private String label; // e.g., "2026-06-17", "Week of 2026-06-15", "Jun 2026", "2026"
        private BigDecimal revenue;
        private Long ordersCount;
    }
}
