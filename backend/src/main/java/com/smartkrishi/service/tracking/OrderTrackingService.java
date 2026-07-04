package com.smartkrishi.service.tracking;

import com.smartkrishi.dto.tracking.OrderTrackingDTO;
import com.smartkrishi.entity.TrackingAuditLog;

import java.math.BigDecimal;
import java.util.List;

public interface OrderTrackingService {
    
    OrderTrackingDTO getTrackingDetails(Long orderId, Long currentUserId);
    
    OrderTrackingDTO assignDeliveryPartner(Long orderId, Long deliveryUserId, Long currentUserId);
    
    OrderTrackingDTO updateLocation(Long orderId, BigDecimal latitude, BigDecimal longitude, Integer etaMinutes, Long currentUserId);
    
    OrderTrackingDTO updateStatus(Long orderId, String status, Long currentUserId);
    
    List<TrackingAuditLog> getAuditLogs(Long orderId, Long currentUserId);

    OrderTrackingDTO updateVehiclePosition(Long orderId, BigDecimal latitude, BigDecimal longitude, Double speed, Long timestamp, Long currentUserId);
}
