package com.smartkrishi.dto.order;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class OrderDTO {
    
    private Long id;
    
    private String orderNumber;
    
    @NotNull(message = "Buyer ID is required")
    private Long buyerId;
    
    private String buyerName;
    
    private Long sellerId;
    
    private String sellerName;
    
    private String orderStatus;
    
    private BigDecimal subtotalAmount;
    
    private BigDecimal discountAmount;
    
    private BigDecimal taxAmount;
    
    private BigDecimal shippingCharge;
    
    private BigDecimal totalAmount;
    
    private BigDecimal orderAmount;
    
    private BigDecimal platformFee;
    
    private BigDecimal sellerAmount;
    
    private BigDecimal finalAmount;
    
    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;
    
    private LocalDateTime expectedDeliveryDate;
    
    private LocalDateTime actualDeliveryDate;
    
    private String cancellationReason;
    
    private List<OrderItemDTO> orderItems;

    private Integer totalItemsCount;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
