package com.smartkrishi.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionAnalyticsDTO {
    private BigDecimal totalCommission;
    private Map<String, BigDecimal> monthlyCommission;
    private Map<String, BigDecimal> categoryCommission;
}
