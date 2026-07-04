package com.smartkrishi.dto.fertilizer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FertilizerDTO {
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
    private String fertilizerName;
    private String brand;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String productStatus;
    private LocalDateTime createdAt;
}
