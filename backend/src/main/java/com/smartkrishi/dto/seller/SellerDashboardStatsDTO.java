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
public class SellerDashboardStatsDTO {
    
    private Long totalProducts;
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private Long pendingOrdersCount;
    private Long completedOrdersCount;
    private List<MonthlySalesDTO> monthlySales;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlySalesDTO {
        private String month;
        private Integer monthValue;
        private BigDecimal sales;
    }
}
