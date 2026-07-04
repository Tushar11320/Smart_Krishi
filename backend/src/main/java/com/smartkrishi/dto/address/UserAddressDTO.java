package com.smartkrishi.dto.address;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddressDTO {
    private Long id;
    private Long userId;
    
    @NotBlank(message = "Address type is required")
    private String addressType;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Mobile number must be a valid 10-digit Indian mobile number")
    private String mobileNumber;
    
    @Pattern(regexp = "^$|^[6-9]\\d{9}$", message = "Alternate mobile number must be a valid 10-digit Indian mobile number or empty")
    private String alternateMobileNumber;
    
    @NotBlank(message = "House/Flat number is required")
    private String houseNumber;
    
    @NotBlank(message = "Street address is required")
    private String street;
    
    private String landmark;
    
    private String village;
    
    @NotBlank(message = "Village/City is required")
    private String city;
    
    private Double latitude;
    private Double longitude;
    
    @NotBlank(message = "District is required")
    private String district;
    
    @NotBlank(message = "State is required")
    private String state;
    
    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^[1-9]\\d{5}$", message = "Pincode must be a valid 6-digit Indian PIN code")
    private String pincode;
    
    private String country;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
