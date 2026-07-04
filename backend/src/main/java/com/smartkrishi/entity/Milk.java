package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "milks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class Milk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "product_id", unique = true, nullable = true)
    private Product product;

    @Column(nullable = false, length = 50)
    private String milkType; // Cow, Buffalo, Goat

    @Column(nullable = false)
    private Double fatPercentage;

    @Column(nullable = false)
    private Boolean dailyAvailability = true;

    @Column(nullable = false)
    private Integer deliveryRadius; // in km

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
