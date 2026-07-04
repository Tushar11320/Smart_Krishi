package com.smartkrishi.dto.seller;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SellerProfileDTO {
    
    private Long id;
    
    private Long userId;
    
    private String firstName;
    
    private String lastName;
    
    private String email;
    
    private String phone;
    
    private String businessName;
    
    private String businessCategory;
    
    private String businessWebsite;
    
    private String logoUrl;
    
    private String sellerStatus;

    // Added fields for Merchant Onboarding
    private String businessType;
    private String gstNumber;
    private String panNumber;
    private String businessRegistrationNumber;
    private String shopAddress;
    private String state;
    private String district;
    private String pincode;
    private String bankAccountHolderName;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String upiId;
    private String aadhaarDocumentUrl;
    private String businessCertificateUrl;
    private String rejectionReason;
    
    private Long totalProducts;
    
    private Long totalSales;
    
    private Double rating;
    
    private Long reviewCount;
    
    private Double returnRate;
    
    private Double cancellationRate;
    
    private String profileImage;
    
    private String bio;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
