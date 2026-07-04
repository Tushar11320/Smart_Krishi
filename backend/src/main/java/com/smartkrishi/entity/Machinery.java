package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "machinery")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class Machinery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "product_id", unique = true, nullable = true)
    private Product product;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Machinery type is required")
    private String machineryType;

    @Column(length = 255)
    private String brandName;

    @Column(length = 255)
    private String modelNumber;

    @Column(length = 100)
    private String engineType;

    private Integer powerHp;

    @Column(length = 255)
    private String capacitySpecification;

    private Integer maintenanceIntervalHours;

    private Integer warrantyYears;

    @Column(length = 100)
    private String fuelEfficiency;

    private Integer noiseLevelDb;

    @Column(name = "manufacturing_year")
    private Integer manufacturingYear;

    @Column(name = "condition_status", length = 50)
    private String conditionStatus;

    private Boolean negotiable = false;

    @Column(name = "rent_per_hour", precision = 15, scale = 2)
    private java.math.BigDecimal rentPerHour;

    @Column(name = "rent_per_day", precision = 15, scale = 2)
    private java.math.BigDecimal rentPerDay;

    @Column(name = "rent_per_week", precision = 15, scale = 2)
    private java.math.BigDecimal rentPerWeek;

    @Column(name = "security_deposit", precision = 15, scale = 2)
    private java.math.BigDecimal securityDeposit;

    @Column(name = "available_for_sale")
    private Boolean availableForSale = true;

    @Column(name = "available_for_rent")
    private Boolean availableForRent = false;

    @Column(name = "available_for_both")
    private Boolean availableForBoth = false;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String district;

    @Column(name = "village_city", length = 100)
    private String villageCity;

    @Column(length = 20)
    private String pincode;

    @Column(name = "gps_location", length = 100)
    private String gpsLocation;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "registration_certificate_url", length = 500)
    private String registrationCertificateUrl;

    @Column(name = "insurance_document_url", length = 500)
    private String insuranceDocumentUrl;

    @Column(name = "engine_power", length = 100)
    private String enginePower;

    @Column(name = "fuel_type", length = 100)
    private String fuelType;

    @Column(name = "working_width", length = 100)
    private String workingWidth;

    @Column(length = 100)
    private String weight;

    @Column(name = "other_specifications", columnDefinition = "TEXT")
    private String otherSpecifications;

    @Column(name = "seller_contact_name", length = 100)
    private String sellerContactName;

    @Column(name = "mobile_number", length = 20)
    private String mobileNumber;

    @Column(name = "alternate_number", length = 20)
    private String alternateNumber;

    @Column(name = "whatsapp_number", length = 20)
    private String whatsappNumber;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
