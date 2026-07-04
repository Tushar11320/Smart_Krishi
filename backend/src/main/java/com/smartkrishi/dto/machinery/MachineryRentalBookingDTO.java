package com.smartkrishi.dto.machinery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MachineryRentalBookingDTO {
    private Long id;
    
    // Machinery details
    private Long machineryId;
    private Long productId;
    private String machineryName;
    private String machineryType;
    private String brandName;
    private String modelNumber;
    private String conditionStatus;
    
    // Buyer details
    private Long buyerId;
    private String buyerName;
    private String buyerPhone;
    private String buyerEmail;
    
    // Seller details
    private Long sellerId;
    private String sellerBusinessName;
    
    // Booking details
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalPrice;
    private BigDecimal securityDeposit;
    private String bookingStatus;
    private Boolean returnConfirmed;
    private LocalDateTime createdAt;
}
