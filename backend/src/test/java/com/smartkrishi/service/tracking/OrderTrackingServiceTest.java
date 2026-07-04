package com.smartkrishi.service.tracking;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartkrishi.dto.tracking.OrderTrackingDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import com.smartkrishi.websocket.TrackingWebSocketHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderTrackingServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DeliveryProfileRepository deliveryProfileRepository;

    @Mock
    private OrderTrackingRepository orderTrackingRepository;

    @Mock
    private TrackingAuditLogRepository trackingAuditLogRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OrderTrackingServiceImpl orderTrackingService;

    // Concrete subclass to bypass Mockito JDK 25 limitations with TextWebSocketHandler subclassing
    private static class TestTrackingWebSocketHandler extends TrackingWebSocketHandler {
        public boolean broadcastCalled = false;
        public Long lastOrderId;
        public OrderTrackingDTO lastDto;

        @Override
        public void broadcastTrackingUpdate(Long orderId, OrderTrackingDTO dto) {
            this.broadcastCalled = true;
            this.lastOrderId = orderId;
            this.lastDto = dto;
        }

        public void reset() {
            this.broadcastCalled = false;
            this.lastOrderId = null;
            this.lastDto = null;
        }
    }

    private TestTrackingWebSocketHandler webSocketHandler = new TestTrackingWebSocketHandler();

    private User buyer;
    private User sellerUser;
    private SellerProfile sellerProfile;
    private User admin;
    private User driverUser;
    private DeliveryProfile deliveryProfile;
    private Order order;
    private OrderTracking orderTracking;

    private Role createRole(Role.RoleType roleType) {
        Role role = new Role();
        role.setRoleType(roleType);
        return role;
    }

    @BeforeEach
    void setUp() {
        webSocketHandler.reset();
        ReflectionTestUtils.setField(orderTrackingService, "webSocketHandler", webSocketHandler);
        ReflectionTestUtils.setField(orderTrackingService, "objectMapper", objectMapper);

        buyer = new User();
        buyer.setId(1L);
        buyer.setEmail("buyer@test.com");
        buyer.setFirstName("Buyer");
        buyer.setLastName("User");
        buyer.setRoles(Collections.singleton(createRole(Role.RoleType.ROLE_USER)));

        sellerUser = new User();
        sellerUser.setId(2L);
        sellerUser.setEmail("seller@test.com");
        sellerUser.setFirstName("Seller");
        sellerUser.setLastName("User");
        sellerUser.setRoles(Collections.singleton(createRole(Role.RoleType.ROLE_SELLER)));

        sellerProfile = new SellerProfile();
        sellerProfile.setId(10L);
        sellerProfile.setUser(sellerUser);

        admin = new User();
        admin.setId(3L);
        admin.setEmail("admin@test.com");
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setRoles(Collections.singleton(createRole(Role.RoleType.ROLE_ADMIN)));

        driverUser = new User();
        driverUser.setId(4L);
        driverUser.setEmail("driver@test.com");
        driverUser.setFirstName("Driver");
        driverUser.setLastName("User");
        driverUser.setRoles(Collections.singleton(createRole(Role.RoleType.ROLE_USER)));

        deliveryProfile = new DeliveryProfile();
        deliveryProfile.setId(20L);
        deliveryProfile.setUser(driverUser);
        deliveryProfile.setStatus("AVAILABLE");
        deliveryProfile.setVehicleType("MOTORCYCLE");
        deliveryProfile.setVehicleNumber("MH12AB1234");

        order = new Order();
        order.setId(100L);
        order.setBuyer(buyer);
        order.setSeller(sellerProfile);
        order.setOrderStatus(Order.OrderStatus.PENDING);

        orderTracking = new OrderTracking();
        orderTracking.setId(50L);
        orderTracking.setOrder(order);
        orderTracking.setDeliveryProfile(deliveryProfile);
        orderTracking.setStatus("ASSIGNED");
        orderTracking.setDestinationLatitude(new BigDecimal("28.6139"));
        orderTracking.setDestinationLongitude(new BigDecimal("77.2090"));
    }

    @Test
    void testGetTrackingDetails_Buyer_Success() {
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(orderTrackingRepository.findByOrderId(100L)).thenReturn(Optional.of(orderTracking));

        OrderTrackingDTO dto = orderTrackingService.getTrackingDetails(100L, 1L);

        assertNotNull(dto);
        assertEquals(100L, dto.getOrderId());
        assertEquals("ASSIGNED", dto.getStatus());
        assertEquals(deliveryProfile.getId(), dto.getDeliveryProfileId());
    }

    @Test
    void testGetTrackingDetails_Unassigned() {
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(orderTrackingRepository.findByOrderId(100L)).thenReturn(Optional.empty());

        OrderTrackingDTO dto = orderTrackingService.getTrackingDetails(100L, 1L);

        assertNotNull(dto);
        assertEquals(100L, dto.getOrderId());
        assertEquals("UNASSIGNED", dto.getStatus());
        assertNull(dto.getDeliveryProfileId());
    }

    @Test
    void testGetTrackingDetails_Unauthorized_ThrowsAccessDenied() {
        User unauthorizedUser = new User();
        unauthorizedUser.setId(99L);
        unauthorizedUser.setRoles(Collections.singleton(createRole(Role.RoleType.ROLE_USER)));

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(userRepository.findById(99L)).thenReturn(Optional.of(unauthorizedUser));
        when(orderTrackingRepository.findByOrderId(100L)).thenReturn(Optional.of(orderTracking));

        assertThrows(AccessDeniedException.class, () -> {
            orderTrackingService.getTrackingDetails(100L, 99L);
        });
    }

    @Test
    void testAssignDeliveryPartner_Success() {
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
        when(userRepository.findById(4L)).thenReturn(Optional.of(driverUser));
        when(deliveryProfileRepository.findByUserId(4L)).thenReturn(Optional.of(deliveryProfile));
        when(orderTrackingRepository.findByOrderId(100L)).thenReturn(Optional.empty());
        when(orderTrackingRepository.save(any(OrderTracking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderTrackingDTO dto = orderTrackingService.assignDeliveryPartner(100L, 4L, 3L);

        assertNotNull(dto);
        assertEquals("ASSIGNED", dto.getStatus());
        assertEquals("BUSY", deliveryProfile.getStatus());
        verify(orderTrackingRepository).save(any(OrderTracking.class));
        verify(trackingAuditLogRepository).save(any(TrackingAuditLog.class));
        assertTrue(webSocketHandler.broadcastCalled);
        assertEquals(100L, webSocketHandler.lastOrderId);
    }

    @Test
    void testUpdateLocation_Success() {
        when(orderTrackingRepository.findByOrderId(100L)).thenReturn(Optional.of(orderTracking));
        when(userRepository.findById(4L)).thenReturn(Optional.of(driverUser));
        when(orderTrackingRepository.save(any(OrderTracking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BigDecimal currentLat = new BigDecimal("28.5639");
        BigDecimal currentLng = new BigDecimal("77.1090");

        OrderTrackingDTO dto = orderTrackingService.updateLocation(100L, currentLat, currentLng, null, 4L);

        assertNotNull(dto);
        assertEquals(currentLat, dto.getCurrentLatitude());
        assertEquals(currentLng, dto.getCurrentLongitude());
        assertNotNull(dto.getEtaMinutes()); // Dynamic ETA calculation should be triggered
        assertTrue(dto.getEtaMinutes() > 0);
        verify(orderTrackingRepository).save(orderTracking);
        assertTrue(webSocketHandler.broadcastCalled);
        assertEquals(100L, webSocketHandler.lastOrderId);
    }

    @Test
    void testUpdateLocation_Paused_NoUpdate() {
        orderTracking.setStatus("TRACKING_PAUSED");
        when(orderTrackingRepository.findByOrderId(100L)).thenReturn(Optional.of(orderTracking));
        when(userRepository.findById(4L)).thenReturn(Optional.of(driverUser));

        BigDecimal currentLat = new BigDecimal("28.5639");
        BigDecimal currentLng = new BigDecimal("77.1090");

        OrderTrackingDTO dto = orderTrackingService.updateLocation(100L, currentLat, currentLng, null, 4L);

        assertNotNull(dto);
        assertNull(dto.getCurrentLatitude()); // Should not have updated
        verify(orderTrackingRepository, never()).save(any(OrderTracking.class));
        assertFalse(webSocketHandler.broadcastCalled);
    }

    @Test
    void testUpdateStatus_Delivered_Success() {
        when(orderTrackingRepository.findByOrderId(100L)).thenReturn(Optional.of(orderTracking));
        when(userRepository.findById(4L)).thenReturn(Optional.of(driverUser));
        when(orderTrackingRepository.save(any(OrderTracking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(deliveryProfileRepository.save(any(DeliveryProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderTrackingDTO dto = orderTrackingService.updateStatus(100L, "DELIVERED", 4L);

        assertNotNull(dto);
        assertEquals("DELIVERED", dto.getStatus());
        assertEquals("AVAILABLE", deliveryProfile.getStatus());
        assertEquals(Order.OrderStatus.DELIVERED, order.getOrderStatus());
        verify(orderRepository).save(order);
        verify(deliveryProfileRepository).save(deliveryProfile);
        verify(trackingAuditLogRepository).save(any(TrackingAuditLog.class));
        assertTrue(webSocketHandler.broadcastCalled);
        assertEquals(100L, webSocketHandler.lastOrderId);
    }

    @Test
    void testGetAuditLogs_Buyer_Success() {
        TrackingAuditLog logEntry = TrackingAuditLog.builder()
                .id(1L)
                .orderId(100L)
                .actorId(4L)
                .action("STATUS_CHANGE")
                .details("Status changed to DELIVERED")
                .build();

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(orderTrackingRepository.findByOrderId(100L)).thenReturn(Optional.of(orderTracking));
        when(trackingAuditLogRepository.findByOrderId(100L)).thenReturn(Collections.singletonList(logEntry));

        List<TrackingAuditLog> logs = orderTrackingService.getAuditLogs(100L, 1L);

        assertNotNull(logs);
        assertEquals(1, logs.size());
        assertEquals("STATUS_CHANGE", logs.get(0).getAction());
    }
}
