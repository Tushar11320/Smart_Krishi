package com.smartkrishi.dto.notification;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationDTO {
    
    private Long id;
    
    private Long userId;
    
    private String userName;
    
    private String notificationType;
    
    private String title;
    
    private String message;
    
    private String actionUrl;
    
    private String relatedEntityType;
    
    private String relatedEntityId;
    
    private Boolean isRead;
    
    private LocalDateTime readAt;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
