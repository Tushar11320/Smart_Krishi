package com.smartkrishi.service.admin;

import com.smartkrishi.dto.admin.CommissionAnalyticsDTO;
import com.smartkrishi.dto.admin.AdminDashboardStatsDTO;
import com.smartkrishi.dto.admin.FraudAlertDTO;
import java.util.List;

public interface AdminAnalyticsService {
    CommissionAnalyticsDTO getCommissionAnalytics();
    AdminDashboardStatsDTO getAdminDashboardStats();
    List<FraudAlertDTO> getFraudAlerts();
}
