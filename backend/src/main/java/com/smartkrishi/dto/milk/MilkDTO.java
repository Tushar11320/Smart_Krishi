package com.smartkrishi.dto.milk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilkDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private BigDecimal price;
    private String description;
    private Integer quantity;
    private java.util.List<String> imageUrls;
    private java.util.List<com.smartkrishi.dto.product.ProductImageDTO> images;
    private Long sellerId;
    private String sellerBusinessName;
    private String milkType; // Cow, Buffalo, Goat
    private Double fatPercentage;
    private Boolean dailyAvailability;
    private Integer deliveryRadius;
    private String productStatus;
    private LocalDateTime createdAt;
}
