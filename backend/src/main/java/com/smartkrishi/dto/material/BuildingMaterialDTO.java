package com.smartkrishi.dto.material;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BuildingMaterialDTO {
    
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
    
    // Building Material fields
    private String materialType; // Cement, Bricks, Sand, Stone, Iron Rods, Pipes, Other
    private String unit; // bags, pieces, brass, tons, meters
    private Boolean deliveryAvailable;
    private String productStatus;
    private LocalDateTime createdAt;
}
