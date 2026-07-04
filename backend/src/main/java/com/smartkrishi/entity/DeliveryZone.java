package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "delivery_zones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_id", nullable = false, unique = true)
    private Long sellerId;

    @Column(name = "radius_km", nullable = false)
    private Double radiusKm;

    @Column(name = "center_latitude", nullable = false)
    private Double centerLatitude;

    @Column(name = "center_longitude", nullable = false)
    private Double centerLongitude;
}
