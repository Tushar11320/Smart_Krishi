package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fertilizers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class Fertilizer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "product_id", unique = true, nullable = true)
    private Product product;

    @Column(nullable = false, length = 255)
    private String fertilizerName;

    @Column(nullable = false, length = 255)
    private String brand;

    @Column(name = "manufacturing_date")
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
