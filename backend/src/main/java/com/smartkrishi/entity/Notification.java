package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_user_id", columnList = "user_id"),
        @Index(name = "idx_notifications_is_read", columnList = "is_read"),
        @Index(name = "idx_notifications_created_at", columnList = "created_at"),
        @Index(name = "idx_notifications_user_read_created", columnList = "user_id, is_read, created_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "user")
@EqualsAndHashCode(exclude = "user")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType notificationType;

    @Column(length = 100)
    private String relatedEntityType;

    @Column(length = 100)
    private String relatedEntityId;

    @Column(nullable = false)
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED, 
        PAYMENT_RECEIVED, PAYMENT_FAILED, 
        REVIEW_RECEIVED, SELLER_VERIFICATION,
        PRODUCT_OUT_OF_STOCK, PRICE_DROP,
        ORDER_PLACED, PAYMENT_SUCCESS, PAYMENT_FAILURE, OUT_FOR_DELIVERY, DELIVERED, REFUNDS
    }
}
