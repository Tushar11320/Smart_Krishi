package com.smartkrishi.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerInventoryStatsDTO {
    private Long totalListings;
    private Long activeListings;
    private Long inactiveListings;
    private Long lowStockListings;
    private Long outOfStockListings;
}
