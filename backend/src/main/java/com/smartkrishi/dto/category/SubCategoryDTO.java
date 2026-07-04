package com.smartkrishi.dto.category;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubCategoryDTO {
    
    private Long id;
    
    @NotBlank(message = "Subcategory name is required")
    private String subCategoryName;
    
    private String description;
    
    private Long categoryId;
    
    private String categoryName;
    
    private String imageUrl;
    
    private Integer displayOrder;
    
    private Boolean isActive;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
