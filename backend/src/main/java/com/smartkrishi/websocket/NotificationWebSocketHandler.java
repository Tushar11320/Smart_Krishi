package com.smartkrishi.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartkrishi.dto.notification.NotificationDTO;
import com.smartkrishi.entity.Notification;
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
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    // Maps userId to active sessions
    private final Map<Long, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        Map<String, String> queryParams = parseQuery(query);

        String token = queryParams.get("token");

        if (token == null) {
            log.warn("Notification WS connection rejected: Missing token");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("Notification WS connection rejected: Invalid or expired token");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        UserPrincipal principal;
        try {
            principal = (UserPrincipal) userDetailsService.loadUserByUsername(email);
        } catch (Exception e) {
            log.warn("Notification WS connection rejected: User not found for email {}", email);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Long userId = principal.getId();
        session.getAttributes().put("userId", userId);
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("Notification WebSocket connection established for user ID: {}", userId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
            log.info("Notification WebSocket connection closed for user ID: {} with status {}", userId, status);
        }
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

    public void sendNotificationToUser(Long userId, NotificationDTO dto) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
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
                        log.error("Failed to send notification message to session {} for user ID {}", session.getId(), userId, e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to serialize NotificationDTO for user ID {}", userId, e);
        }
    }
}
