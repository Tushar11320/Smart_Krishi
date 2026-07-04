package com.smartkrishi.dto.crop;

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
public class CropDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private BigDecimal price;
    private String cropName;
    private String scientificName;
    private String cropType;
    private String growingSeason;
    private Integer growthCycleDays;
    private String soilType;
    private String waterRequirement;
    private Integer temperatureMin;
    private Integer temperatureMax;
    private String yieldPerHectare;
    private String marketDemand;
    private String variety;
    private String unit;
    private java.time.LocalDate harvestDate;
    private String location;
    private String description;
    private Integer quantity;
    private java.util.List<String> imageUrls;
    private java.util.List<com.smartkrishi.dto.product.ProductImageDTO> images;
    private Long sellerId;
    private String sellerBusinessName;
    private String productStatus;
    private LocalDateTime createdAt;
}
