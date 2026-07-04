package com.smartkrishi.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDTO {
    
    private Long id;
    
    @NotBlank(message = "Product name is required")
    private String productName;
    
    @NotBlank(message = "SKU is required")
    private String sku;
    
    private String productDescription;
    private String shortDescription;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;
    
    private BigDecimal discountPrice;
    private BigDecimal discountPercentage;
    
    @NotNull(message = "Category is required")
    private Long categoryId;
    
    @NotNull(message = "Sub-category is required")
    private Long subcategoryId;
    
    private String categoryName;
    private String subcategoryName;
    
    private Long sellerId;
    
    private String sellerName;
    
    private Integer warrantyMonths;
    private Integer returnPolicyDays;
    
    private String productStatus;
    private BigDecimal rating;
    private Integer reviewCount;
    private Integer purchaseCount;
    private Integer viewCount;
    
    private Boolean isFeatured;
    private Boolean isBestseller;

    private Double latitude;
    private Double longitude;
    private String address;
    private Double distance;
    
    private List<ProductImageDTO> images;
    
    private ProductInventoryDTO inventory;
}
