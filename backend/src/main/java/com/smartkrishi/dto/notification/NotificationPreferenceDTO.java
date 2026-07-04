package com.smartkrishi.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceDTO {
    private String eventType;
    private Boolean inAppEnabled;
    private Boolean emailEnabled;
    private Boolean smsEnabled;
    private Boolean whatsappEnabled;
    private Boolean pushEnabled;
}
