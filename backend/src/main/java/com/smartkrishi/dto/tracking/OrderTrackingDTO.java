package com.smartkrishi.dto.tracking;

import com.fasterxml.jackson.annotation.JsonInclude;
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
public class OrderTrackingDTO {
    private Long id;
    private Long orderId;
    private Long deliveryProfileId;
    private String deliveryPartnerName;
    private String deliveryPartnerPhone;
    private String vehicleType;
    private String vehicleNumber;
    private BigDecimal currentLatitude;
    private BigDecimal currentLongitude;
    private BigDecimal destinationLatitude;
    private BigDecimal destinationLongitude;
    private Integer etaMinutes;
    private String status;
    private String routeHistory;
    private Double speed;
    private Long timestamp;
    private LocalDateTime updatedAt;
}
