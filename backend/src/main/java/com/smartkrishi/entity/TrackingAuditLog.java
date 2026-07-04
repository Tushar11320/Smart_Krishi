package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tracking_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackingAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(nullable = false, length = 100)
    private String action; // e.g. ASSIGNED_DELIVERY, UPDATE_LOCATION, STATUS_CHANGE, SHARING_TOGGLED

    @Column(length = 500)
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
