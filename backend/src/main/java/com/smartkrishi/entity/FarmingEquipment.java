package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "farming_equipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class FarmingEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "product_id", unique = true, nullable = true)
    private Product product;

    @Column(nullable = false)
    private String equipmentName;

    @Column(length = 100)
    private String brand;

    @Column(length = 100)
    private String model;

    @Column(name = "purchase_year")
    private Integer purchaseYear;

    @Column(name = "equipment_condition", length = 50)
    private String equipmentCondition; // e.g., NEW, EXCELLENT, GOOD, FAIR

    @Column(name = "rent_per_hour", precision = 15, scale = 2)
    private BigDecimal rentPerHour;

    @Column(name = "rent_per_day", precision = 15, scale = 2)
    private BigDecimal rentPerDay;

    @Column(name = "security_deposit", precision = 15, scale = 2)
    private BigDecimal securityDeposit;

    @Column(nullable = false)
    private Boolean forSale = true;

    @Column(nullable = false)
    private Boolean forRent = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
