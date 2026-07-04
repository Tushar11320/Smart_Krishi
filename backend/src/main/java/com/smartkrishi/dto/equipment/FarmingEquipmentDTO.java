package com.smartkrishi.dto.equipment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmingEquipmentDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private BigDecimal price;
    private String description;
    private Integer quantity;
    private List<String> imageUrls;
    private java.util.List<com.smartkrishi.dto.product.ProductImageDTO> images;
    private Long sellerId;
    private String sellerBusinessName;
    private String equipmentName;
    private String brand;
    private String model;
    private Integer purchaseYear;
    private String equipmentCondition;
    private BigDecimal rentPerHour;
    private BigDecimal rentPerDay;
    private BigDecimal securityDeposit;
    private Boolean forSale;
    private Boolean forRent;
    private String productStatus;
    private LocalDateTime createdAt;
}
