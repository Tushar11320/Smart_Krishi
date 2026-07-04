package com.smartkrishi.dto.cart;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CartDTO {
    
    private Long id;
    
    private Long buyerId;
    
    private String buyerName;
    
    private Integer totalItems;
    
    private BigDecimal totalPrice;
    
    private List<CartItemDTO> cartItems;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
