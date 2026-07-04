package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_profiles", indexes = {
        @Index(name = "idx_seller_status", columnList = "seller_status"),
        @Index(name = "idx_rating", columnList = "rating")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "user")
@EqualsAndHashCode(exclude = "user")
public class SellerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Business name is required")
    private String businessName;

    @Column(columnDefinition = "TEXT")
    private String businessDescription;

    @Column(length = 100)
    private String businessCategory;

    @Column(length = 500)
    private String businessWebsite;

    @Column(length = 500)
    private String logoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SellerStatus sellerStatus = SellerStatus.PENDING;

    @Column(length = 500)
    private String verificationDocumentUrl;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    // Added fields for Merchant Onboarding Registration
    @Column(length = 100)
    private String businessType;

    @Column(length = 50)
    private String gstNumber;

    @Column(length = 20)
    private String panNumber;

    @Column(length = 100)
    private String businessRegistrationNumber;

    @Column(length = 500)
    private String shopAddress;

    private Double latitude;
    private Double longitude;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String district;

    @Column(length = 20)
    private String pincode;

    @Column(length = 255)
    private String bankAccountHolderName;

    @Column(length = 255)
    private String bankName;

    @Column(length = 100)
    private String accountNumber;

    @Column(length = 20)
    private String ifscCode;

    @Column(length = 100)
    private String upiId;

    @Column(length = 500)
    private String aadhaarDocumentUrl;

    @Column(length = 500)
    private String businessCertificateUrl;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(nullable = false)
    private Integer totalProducts = 0;

    @Column(nullable = false)
    private BigDecimal totalSales = BigDecimal.ZERO;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer reviewCount = 0;

    @Column(nullable = false)
    private Integer responseTimeHours = 0;

    @Column(precision = 5, scale = 2)
    private BigDecimal returnRate = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal cancellationRate = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum SellerStatus {
        PENDING, APPROVED, REJECTED, SUSPENDED
    }
}
