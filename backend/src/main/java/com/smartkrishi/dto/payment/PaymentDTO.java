package com.smartkrishi.dto.payment;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.DecimalMin;
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
public class PaymentDTO {
    
    private Long id;
    
    @NotNull(message = "Order ID is required")
    private Long orderId;
    
    private String orderNumber;
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1", message = "Amount must be at least 1")
    private BigDecimal amount;
    
    private BigDecimal platformFee;
    
    private String currency;
    
    private String razorpayOrderId;
    
    private String razorpayKeyId;
    
    private String razorpayPaymentId;
    
    private String razorpaySignature;
    
    private String paymentStatus;
    
    private String paymentMethod;

    private String gatewayResponse;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
