package com.smartkrishi.dto.cart;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CartItemDTO {
    
    private Long id;
    
    private Long cartId;  // response-only; server resolves from userId path param
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    private String productName;
    
    private BigDecimal unitPrice;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    
    private BigDecimal subtotal;

    private Boolean saveForLater;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
