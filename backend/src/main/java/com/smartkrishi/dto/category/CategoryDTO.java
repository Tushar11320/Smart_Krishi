package com.smartkrishi.dto.category;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CategoryDTO {
    
    private Long id;
    
    @NotBlank(message = "Category name is required")
    private String categoryName;
    
    private String description;
    
    private String imageUrl;
    
    private Integer displayOrder;
    
    private Boolean isActive;
    
    private List<SubCategoryDTO> subcategories;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
