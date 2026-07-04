package com.smartkrishi.config;

import com.smartkrishi.websocket.TrackingWebSocketHandler;
import com.smartkrishi.websocket.NotificationWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private TrackingWebSocketHandler trackingWebSocketHandler;

    @Autowired
    private NotificationWebSocketHandler notificationWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(trackingWebSocketHandler, "/ws/track")
                .setAllowedOrigins("*");
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .setAllowedOrigins("*");
    }
}
