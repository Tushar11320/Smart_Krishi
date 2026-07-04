package com.smartkrishi.dto.land;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LandListingDTO {
    
    private Long id;
    
    @NotNull(message = "Seller ID is required")
    private Long sellerId;
    
    private String sellerName;
    
    @NotBlank(message = "Land title is required")
    private String landTitle;
    
    private String description;
    
    @NotNull(message = "Area in acres is required")
    @DecimalMin(value = "0.1", message = "Area must be at least 0.1 acre")
    private BigDecimal areaInAcres;
    
    private String areaUnit;
    
    private String village;
    
    private Boolean electricityAvailability;
    
    private String roadConnectivity;
    
    private String documentUrl;
    
    @NotBlank(message = "Land type is required")
    private String landType;
    
    @NotBlank(message = "State is required")
    private String state;
    
    @NotBlank(message = "District is required")
    private String district;
    
    private String taluka;
    
    private String pinCode;
    
    private Double latitude;
    
    private Double longitude;
    
    @NotNull(message = "Price per acre is required")
    @DecimalMin(value = "1", message = "Price must be at least 1")
    private BigDecimal pricePerAcre;
    
    private BigDecimal totalPrice;
    
    private String soilInformation;
    
    private String waterSourceInformation;
    
    private String accessibility;
    
    private String landStatus;
    
    private String currency;
    
    private Integer viewCount;
    
    private Integer interestCount;
    
    private List<LandImageDTO> images;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
