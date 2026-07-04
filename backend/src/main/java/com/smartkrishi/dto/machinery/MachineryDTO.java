package com.smartkrishi.dto.machinery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MachineryDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private String description;
    
    // Basic specifications
    private String machineryType;
    private String brandName;
    private String modelNumber;
    private Integer manufacturingYear;
    private String conditionStatus; // NEW, USED, REFURBISHED

    // Pricing
    private BigDecimal price; // Selling price
    private Boolean negotiable;
    private BigDecimal rentPerHour;
    private BigDecimal rentPerDay;
    private BigDecimal rentPerWeek;
    private BigDecimal securityDeposit;

    // Availability
    private Boolean availableForSale;
    private Boolean availableForRent;
    private Boolean availableForBoth;
    private Integer quantityAvailable;

    // Location
    private String state;
    private String district;
    private String villageCity;
    private String pincode;
    private String gpsLocation;

    // Media
    private List<String> imageUrls;
    private java.util.List<com.smartkrishi.dto.product.ProductImageDTO> images;
    private String videoUrl;
    private String registrationCertificateUrl;
    private String insuranceDocumentUrl;

    // Technical Specs
    private String engineType;
    private Integer powerHp;
    private String capacitySpecification;
    private Integer maintenanceIntervalHours;
    private Integer warrantyYears;
    private String fuelEfficiency;
    private Integer noiseLevelDb;
    private String enginePower;
    private String fuelType;
    private String workingWidth;
    private String weight;
    private String otherSpecifications;

    // Contact Details
    private String sellerContactName;
    private String mobileNumber;
    private String alternateNumber;
    private String whatsappNumber;

    // Metadata
    private Long sellerId;
    private String sellerBusinessName;
    private String productStatus;
    private LocalDateTime createdAt;
}
