package com.smartkrishi.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartkrishi.dto.tracking.OrderTrackingDTO;
import com.smartkrishi.entity.Order;
import com.smartkrishi.entity.OrderTracking;
import com.smartkrishi.repository.OrderRepository;
import com.smartkrishi.repository.OrderTrackingRepository;
import com.smartkrishi.security.JwtTokenProvider;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.security.UserDetailsServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class TrackingWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderTrackingRepository orderTrackingRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // Maps orderId to active sessions watching it
    private final Map<Long, Set<WebSocketSession>> orderSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        Map<String, String> queryParams = parseQuery(query);

        String token = queryParams.get("token");
        String orderIdStr = queryParams.get("orderId");

        if (token == null || orderIdStr == null) {
            log.warn("Connection rejected: Missing token or orderId");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Long orderId;
        try {
            orderId = Long.parseLong(orderIdStr);
        } catch (NumberFormatException e) {
            log.warn("Connection rejected: Invalid orderId format");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("Connection rejected: Invalid or expired token");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        UserPrincipal principal;
        try {
            principal = (UserPrincipal) userDetailsService.loadUserByUsername(email);
        } catch (Exception e) {
            log.warn("Connection rejected: User not found for email {}", email);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("Connection rejected: Order not found for id {}", orderId);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        boolean isAuthorized = checkAuthorization(order, principal);
        if (!isAuthorized) {
            log.warn("Connection rejected: User {} is not authorized to track order {}", principal.getId(), orderId);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        // Keep track of the session
        session.getAttributes().put("orderId", orderId);
        orderSessions.computeIfAbsent(orderId, k -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("WebSocket connection established for order {} by user {}", orderId, principal.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long orderId = (Long) session.getAttributes().get("orderId");
        if (orderId != null) {
            Set<WebSocketSession> sessions = orderSessions.get(orderId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    orderSessions.remove(orderId);
                }
            }
            log.info("WebSocket connection closed for order {} with status {}", orderId, status);
        }
    }

    private boolean checkAuthorization(Order order, UserPrincipal principal) {
        // 1. Check Admin / Super Admin
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if (isAdmin) {
            return true;
        }

        // 2. Check Buyer
        if (order.getBuyer().getId().equals(principal.getId())) {
            return true;
        }

        // 3. Check Seller
        if (order.getSeller() != null && order.getSeller().getUser().getId().equals(principal.getId())) {
            return true;
        }

        // 4. Check assigned delivery partner
        OrderTracking tracking = orderTrackingRepository.findByOrderId(order.getId()).orElse(null);
        if (tracking != null && tracking.getDeliveryProfile() != null &&
                tracking.getDeliveryProfile().getUser().getId().equals(principal.getId())) {
            return true;
        }

        return false;
    }

    private Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.trim().isEmpty()) {
            return params;
        }
        for (String param : query.split("&")) {
            String[] entry = param.split("=");
            if (entry.length > 1) {
                params.put(entry[0], entry[1]);
            } else if (entry.length > 0) {
                params.put(entry[0], "");
            }
        }
        return params;
    }

    public void broadcastTrackingUpdate(Long orderId, OrderTrackingDTO dto) {
        Set<WebSocketSession> sessions = orderSessions.get(orderId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            String jsonPayload = objectMapper.writeValueAsString(dto);
            TextMessage textMessage = new TextMessage(jsonPayload);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        log.error("Failed to send tracking update to session {} for order {}", session.getId(), orderId, e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to serialize OrderTrackingDTO for order {}", orderId, e);
        }
    }
}
