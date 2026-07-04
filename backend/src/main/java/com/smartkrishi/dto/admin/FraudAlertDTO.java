package com.smartkrishi.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudAlertDTO {
    private Long id;
    private String type; // e.g. "Price Anomaly", "Velocity Block", "High Value Order"
    private String detail;
    private String severity; // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    private String affectedUserEmail;
    private Long affectedUserId;
    private LocalDateTime createdAt;
}
