package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "crops")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "product_id", unique = true, nullable = true)
    private Product product;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Crop name is required")
    private String cropName;

    @Column(length = 255)
    private String scientificName;

    @Column(length = 100)
    private String cropType;

    @Column(length = 100)
    private String growingSeason;

    private Integer growthCycleDays;

    @Column(length = 255)
    private String soilType;

    @Column(length = 255)
    private String waterRequirement;

    private Integer temperatureMin;

    private Integer temperatureMax;

    @Column(length = 255)
    private String yieldPerHectare;

    @Column(length = 255)
    private String marketDemand;

    @Column(length = 255)
    private String variety;

    @Column(length = 50)
    private String unit;

    @Column(name = "harvest_date")
    private java.time.LocalDate harvestDate;

    @Column(length = 255)
    private String location;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
