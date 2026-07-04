package com.smartkrishi.dto.wishlist;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
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
public class WishlistDTO {
    
    private Long id;
    
    @NotNull(message = "Buyer ID is required")
    private Long buyerId;
    
    private String buyerName;
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    private String productName;
    
    private String productImage;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
