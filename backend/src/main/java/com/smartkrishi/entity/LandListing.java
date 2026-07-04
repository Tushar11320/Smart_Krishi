package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "land_listings", indexes = {
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_status", columnList = "land_status"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"seller", "images"})
@EqualsAndHashCode(exclude = {"seller", "images"})
public class LandListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Land title is required")
    private String landTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    @NotNull(message = "Area is required")
    private BigDecimal areaInAcres;

    @Column(nullable = false, length = 20)
    private String areaUnit = "acre";

    @Column(length = 100)
    private String village;

    @Column(nullable = false)
    private Boolean electricityAvailability = false;

    @Column(length = 100)
    private String roadConnectivity;

    @Column(length = 500)
    private String documentUrl;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Land type is required")
    private String landType;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String taluka;

    @Column(nullable = false, length = 20)
    private String pinCode;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(nullable = false, precision = 15, scale = 2)
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @NotNull(message = "Price is required")
    private BigDecimal pricePerAcre;

    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Column(columnDefinition = "TEXT")
    private String soilInformation;

    @Column(columnDefinition = "TEXT")
    private String waterSourceInformation;

    @Column(columnDefinition = "TEXT")
    private String accessibility;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LandStatus landStatus = LandStatus.AVAILABLE;

    @Column(nullable = false)
    private Integer viewCount = 0;

    @Column(nullable = false)
    private Integer interestCount = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "landListing", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<LandImage> images = new HashSet<>();

    public enum LandStatus {
        AVAILABLE, SOLD, UNDER_NEGOTIATION, DELISTED
    }
}
