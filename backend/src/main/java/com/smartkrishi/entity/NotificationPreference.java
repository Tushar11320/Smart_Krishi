package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preferences", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_event", columnNames = { "user_id", "event_type" })
}, indexes = {
        @Index(name = "idx_pref_user_id", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "user")
@EqualsAndHashCode(exclude = "user")
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "in_app_enabled", nullable = false)
    private Boolean inAppEnabled = true;

    @Column(name = "email_enabled", nullable = false)
    private Boolean emailEnabled = true;

    @Column(name = "sms_enabled", nullable = false)
    private Boolean smsEnabled = true;

    @Column(name = "whatsapp_enabled", nullable = false)
    private Boolean whatsappEnabled = true;

    @Column(name = "push_enabled", nullable = false)
    private Boolean pushEnabled = true;
}
