package com.smartkrishi.service.tracking;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartkrishi.dto.tracking.OrderTrackingDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import com.smartkrishi.websocket.TrackingWebSocketHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class OrderTrackingServiceImpl implements OrderTrackingService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeliveryProfileRepository deliveryProfileRepository;

    @Autowired
    private OrderTrackingRepository orderTrackingRepository;

    @Autowired
    private TrackingAuditLogRepository trackingAuditLogRepository;

    @Autowired
    private TrackingWebSocketHandler webSocketHandler;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public OrderTrackingDTO getTrackingDetails(Long orderId, Long currentUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        OrderTracking tracking = orderTrackingRepository.findByOrderId(orderId).orElse(null);

        // Check Access
        checkAccess(order, tracking, user);

        if (tracking == null) {
            // If order exists but tracking is not initialized yet (unassigned driver)
            return OrderTrackingDTO.builder()
                    .orderId(orderId)
                    .status("UNASSIGNED")
                    .destinationLatitude(new BigDecimal("28.6139")) // default Delhi coord
                    .destinationLongitude(new BigDecimal("77.2090"))
                    .build();
        }

        return convertToDTO(tracking);
    }

    @Override
    @Transactional
    public OrderTrackingDTO assignDeliveryPartner(Long orderId, Long deliveryUserId, Long currentUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Only Admin or the Seller of the order can assign driver
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getRoleType() == Role.RoleType.ROLE_ADMIN || r.getRoleType() == Role.RoleType.ROLE_SUPER_ADMIN);
        
        boolean isSeller = order.getSeller() != null && 
                order.getSeller().getUser().getId().equals(currentUserId);

        if (!isAdmin && !isSeller) {
            throw new AccessDeniedException("Only admins or the order seller can assign a delivery partner");
        }

        User driver = userRepository.findById(deliveryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver User", "id", deliveryUserId));

        DeliveryProfile deliveryProfile = deliveryProfileRepository.findByUserId(deliveryUserId)
                .orElseThrow(() -> new BadRequestException("Selected user does not have a delivery profile"));

        OrderTracking tracking = orderTrackingRepository.findByOrderId(orderId).orElse(null);
        if (tracking == null) {
            tracking = OrderTracking.builder()
                    .order(order)
                    .destinationLatitude(new BigDecimal("28.6139")) // Default fallback
                    .destinationLongitude(new BigDecimal("77.2090"))
                    .build();
        }

        tracking.setDeliveryProfile(deliveryProfile);
        tracking.setStatus("ASSIGNED");
        
        // Mark driver busy
        deliveryProfile.setStatus("BUSY");
        deliveryProfileRepository.save(deliveryProfile);

        OrderTracking savedTracking = orderTrackingRepository.save(tracking);

        // Audit log
        TrackingAuditLog auditLog = TrackingAuditLog.builder()
                .orderId(orderId)
                .actorId(currentUserId)
                .action("ASSIGNED_DELIVERY")
                .details("Assigned driver " + driver.getFirstName() + " " + driver.getLastName() + " (ID: " + deliveryUserId + ")")
                .build();
        trackingAuditLogRepository.save(auditLog);

        OrderTrackingDTO dto = convertToDTO(savedTracking);
        webSocketHandler.broadcastTrackingUpdate(orderId, dto);

        return dto;
    }

    @Override
    @Transactional
    public OrderTrackingDTO updateLocation(Long orderId, BigDecimal latitude, BigDecimal longitude, Integer etaMinutes, Long currentUserId) {
        OrderTracking tracking = orderTrackingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderTracking", "orderId", orderId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Verify that actor is the assigned driver or admin
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getRoleType() == Role.RoleType.ROLE_ADMIN || r.getRoleType() == Role.RoleType.ROLE_SUPER_ADMIN);

        boolean isAssignedDriver = tracking.getDeliveryProfile() != null && 
                tracking.getDeliveryProfile().getUser().getId().equals(currentUserId);

        if (!isAdmin && !isAssignedDriver) {
            throw new AccessDeniedException("Unauthorized to update location for this order");
        }

        // If driver paused location sharing, honor privacy: skip updating coordinates and history
        if ("TRACKING_PAUSED".equals(tracking.getStatus())) {
            log.info("Location update skipped for order {} because tracking is paused", orderId);
            return convertToDTO(tracking);
        }

        tracking.setCurrentLatitude(latitude);
        tracking.setCurrentLongitude(longitude);
        
        if (etaMinutes == null && tracking.getDestinationLatitude() != null && tracking.getDestinationLongitude() != null) {
            // Calculate distance in km using Haversine formula
            double distance = calculateHaversineDistance(
                latitude.doubleValue(), longitude.doubleValue(),
                tracking.getDestinationLatitude().doubleValue(), tracking.getDestinationLongitude().doubleValue()
            );
            // Assume average speed of 30 km/h (0.5 km/min).
            // ETA = distance / speed
            // Let's round it up to nearest integer. Minimum 1 minute.
            etaMinutes = (int) Math.ceil(distance / 0.5);
            if (etaMinutes < 1) etaMinutes = 1;
        }
        
        tracking.setEtaMinutes(etaMinutes);

        // Append to route history
        String updatedHistory = appendToHistory(tracking.getRouteHistory(), latitude, longitude);
        tracking.setRouteHistory(updatedHistory);

        OrderTracking savedTracking = orderTrackingRepository.save(tracking);

        // Broadcast to WebSocket clients
        OrderTrackingDTO dto = convertToDTO(savedTracking);
        webSocketHandler.broadcastTrackingUpdate(orderId, dto);

        return dto;
    }

    @Override
    @Transactional
    public OrderTrackingDTO updateStatus(Long orderId, String status, Long currentUserId) {
        OrderTracking tracking = orderTrackingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderTracking", "orderId", orderId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Verify actor is driver or admin
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getRoleType() == Role.RoleType.ROLE_ADMIN || r.getRoleType() == Role.RoleType.ROLE_SUPER_ADMIN);

        boolean isAssignedDriver = tracking.getDeliveryProfile() != null && 
                tracking.getDeliveryProfile().getUser().getId().equals(currentUserId);

        if (!isAdmin && !isAssignedDriver) {
            throw new AccessDeniedException("Unauthorized to update status for this order");
        }

        String oldStatus = tracking.getStatus();
        tracking.setStatus(status);

        // Perform side effects based on new status
        if ("DELIVERED".equals(status)) {
            // Free driver
            if (tracking.getDeliveryProfile() != null) {
                DeliveryProfile driverProfile = tracking.getDeliveryProfile();
                driverProfile.setStatus("AVAILABLE");
                deliveryProfileRepository.save(driverProfile);
            }
            // Update order status
            Order order = tracking.getOrder();
            order.setOrderStatus(Order.OrderStatus.DELIVERED);
            order.setActualDeliveryDate(LocalDate.now());
            orderRepository.save(order);
        } else if ("OUT_FOR_DELIVERY".equals(status)) {
            Order order = tracking.getOrder();
            order.setOrderStatus(Order.OrderStatus.OUT_FOR_DELIVERY);
            orderRepository.save(order);
        } else if ("PICKED_UP".equals(status)) {
            Order order = tracking.getOrder();
            order.setOrderStatus(Order.OrderStatus.SHIPPED);
            orderRepository.save(order);
        } else if ("PACKED".equals(status)) {
            Order order = tracking.getOrder();
            order.setOrderStatus(Order.OrderStatus.PACKED);
            orderRepository.save(order);
        }

        OrderTracking savedTracking = orderTrackingRepository.save(tracking);

        // Audit log
        TrackingAuditLog auditLog = TrackingAuditLog.builder()
                .orderId(orderId)
                .actorId(currentUserId)
                .action("STATUS_CHANGE")
                .details("Status changed from " + oldStatus + " to " + status)
                .build();
        trackingAuditLogRepository.save(auditLog);

        OrderTrackingDTO dto = convertToDTO(savedTracking);
        webSocketHandler.broadcastTrackingUpdate(orderId, dto);

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrackingAuditLog> getAuditLogs(Long orderId, Long currentUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        OrderTracking tracking = orderTrackingRepository.findByOrderId(orderId).orElse(null);

        // Check access
        checkAccess(order, tracking, user);

        return trackingAuditLogRepository.findByOrderId(orderId);
    }

    private void checkAccess(Order order, OrderTracking tracking, User user) {
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getRoleType() == Role.RoleType.ROLE_ADMIN || r.getRoleType() == Role.RoleType.ROLE_SUPER_ADMIN);
        if (isAdmin) {
            return;
        }

        if (order.getBuyer().getId().equals(user.getId())) {
            return;
        }

        if (order.getSeller() != null && order.getSeller().getUser().getId().equals(user.getId())) {
            return;
        }

        if (tracking != null && tracking.getDeliveryProfile() != null && 
                tracking.getDeliveryProfile().getUser().getId().equals(user.getId())) {
            return;
        }

        throw new AccessDeniedException("You are not authorized to access tracking data for this order");
    }

    private OrderTrackingDTO convertToDTO(OrderTracking tracking) {
        OrderTrackingDTO.OrderTrackingDTOBuilder builder = OrderTrackingDTO.builder()
                .id(tracking.getId())
                .orderId(tracking.getOrder().getId())
                .currentLatitude(tracking.getCurrentLatitude())
                .currentLongitude(tracking.getCurrentLongitude())
                .destinationLatitude(tracking.getDestinationLatitude())
                .destinationLongitude(tracking.getDestinationLongitude())
                .etaMinutes(tracking.getEtaMinutes())
                .status(tracking.getStatus())
                .routeHistory(tracking.getRouteHistory())
                .speed(tracking.getSpeed())
                .timestamp(tracking.getTimestamp())
                .updatedAt(tracking.getUpdatedAt());

        if (tracking.getDeliveryProfile() != null) {
            DeliveryProfile profile = tracking.getDeliveryProfile();
            builder.deliveryProfileId(profile.getId())
                    .vehicleType(profile.getVehicleType())
                    .vehicleNumber(profile.getVehicleNumber());
            
            if (profile.getUser() != null) {
                builder.deliveryPartnerName(profile.getUser().getFirstName() + " " + profile.getUser().getLastName())
                        .deliveryPartnerPhone(profile.getUser().getPhone());
            }
        }

        return builder.build();
    }

    private String appendToHistory(String historyStr, BigDecimal lat, BigDecimal lng) {
        try {
            List<Map<String, Object>> history = new ArrayList<>();
            if (historyStr != null && !historyStr.trim().isEmpty()) {
                history = objectMapper.readValue(historyStr, new TypeReference<List<Map<String, Object>>>() {});
            }
            Map<String, Object> newPoint = new HashMap<>();
            newPoint.put("lat", lat);
            newPoint.put("lng", lng);
            newPoint.put("timestamp", LocalDateTime.now().toString());
            history.add(newPoint);
            return objectMapper.writeValueAsString(history);
        } catch (Exception e) {
            log.error("Error updating route history coordinates", e);
            return historyStr;
        }
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    @Transactional
    public OrderTrackingDTO updateVehiclePosition(Long orderId, BigDecimal latitude, BigDecimal longitude, Double speed, Long timestamp, Long currentUserId) {
        OrderTracking tracking = orderTrackingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderTracking", "orderId", orderId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getRoleType() == Role.RoleType.ROLE_ADMIN || r.getRoleType() == Role.RoleType.ROLE_SUPER_ADMIN);
        boolean isAssignedDriver = tracking.getDeliveryProfile() != null && 
                tracking.getDeliveryProfile().getUser().getId().equals(currentUserId);

        if (!isAdmin && !isAssignedDriver) {
            throw new AccessDeniedException("Unauthorized to update vehicle position");
        }

        if ("TRACKING_PAUSED".equals(tracking.getStatus())) {
            return convertToDTO(tracking);
        }

        tracking.setCurrentLatitude(latitude);
        tracking.setCurrentLongitude(longitude);
        tracking.setSpeed(speed);
        tracking.setTimestamp(timestamp);

        if (tracking.getDestinationLatitude() != null && tracking.getDestinationLongitude() != null) {
            double distance = calculateHaversineDistance(
                latitude.doubleValue(), longitude.doubleValue(),
                tracking.getDestinationLatitude().doubleValue(), tracking.getDestinationLongitude().doubleValue()
            );
            int eta = (int) Math.ceil(distance / 0.5);
            if (eta < 1) eta = 1;
            tracking.setEtaMinutes(eta);
        }

        String updatedHistory = appendToHistory(tracking.getRouteHistory(), latitude, longitude);
        tracking.setRouteHistory(updatedHistory);

        OrderTracking savedTracking = orderTrackingRepository.save(tracking);
        
        OrderTrackingDTO dto = convertToDTO(savedTracking);
        webSocketHandler.broadcastTrackingUpdate(orderId, dto);

        return dto;
    }
}
