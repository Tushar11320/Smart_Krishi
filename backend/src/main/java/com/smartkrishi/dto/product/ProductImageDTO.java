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
public class ProductImageDTO {
    
    private Long id;
    private String imageUrl;
    private String publicId;
    private Boolean isPrimary;
    private Integer displayOrder;
}
