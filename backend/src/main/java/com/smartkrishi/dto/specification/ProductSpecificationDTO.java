package com.smartkrishi.dto.specification;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSpecificationDTO {
    private Long id;
    private Long productId;
    
    @NotBlank(message = "Specification key is required")
    private String specKey;
    
    @NotBlank(message = "Specification value is required")
    private String specValue;
    
    private Integer displayOrder;
}
