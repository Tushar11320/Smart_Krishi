package com.smartkrishi.dto.equipment;

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
public class RentalBookingDTO {
    private Long id;
    private Long farmingEquipmentId;
    private String equipmentName;
    private Long buyerId;
    private String buyerName;
    private String buyerEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalPrice;
    private String bookingStatus;
    private LocalDateTime createdAt;
}
