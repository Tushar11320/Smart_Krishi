package com.smartkrishi.dto.variant;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class ProductVariantDTO {
    private Long id;
    private Long productId;
    
    @NotBlank(message = "Variant SKU is required")
    private String variantSku;
    
    @NotBlank(message = "Variant name is required")
    private String variantName;
    
    @DecimalMin(value = "0.0", message = "Variant price must be non-negative")
    private BigDecimal variantPrice;
    
    private BigDecimal variantDiscountPrice;
    private String variantImageUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
