package com.smartkrishi.dto.land;

import com.fasterxml.jackson.annotation.JsonInclude;
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
public class LandImageDTO {
    
    private Long id;
    
    private Long landListingId;
    
    private String imageUrl;
    
    private String publicId;
    
    private Boolean isPrimary;
    
    private Integer displayOrder;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
