package com.smartkrishi.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductInventoryDTO {
    
    private Long id;
    private Integer quantityAvailable;
    private Integer quantityReserved;
    private Integer quantitySold;
    private Integer reorderLevel;
    private Integer reorderQuantity;
    private Integer availableQuantity;
}
