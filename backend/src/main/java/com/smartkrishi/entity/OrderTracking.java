package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_tracking")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"order", "deliveryProfile"})
@EqualsAndHashCode(exclude = {"order", "deliveryProfile"})
public class OrderTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_profile_id")
    private DeliveryProfile deliveryProfile;

    @Column(name = "current_latitude", precision = 10, scale = 8)
    private BigDecimal currentLatitude;

    @Column(name = "current_longitude", precision = 11, scale = 8)
    private BigDecimal currentLongitude;

    @Column(name = "destination_latitude", nullable = false, precision = 10, scale = 8)
    private BigDecimal destinationLatitude;

    @Column(name = "destination_longitude", nullable = false, precision = 11, scale = 8)
    private BigDecimal destinationLongitude;

    @Column(name = "eta_minutes")
    private Integer etaMinutes;

    @Column(nullable = false, length = 50)
    private String status = "ASSIGNED"; // ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, TRACKING_PAUSED

    @Column(name = "route_history", columnDefinition = "TEXT")
    private String routeHistory; // JSON array of past coords e.g. [{"lat": 12.3, "lng": 77.4, "time": "..."}]

    private Double speed;

    private Long timestamp;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
