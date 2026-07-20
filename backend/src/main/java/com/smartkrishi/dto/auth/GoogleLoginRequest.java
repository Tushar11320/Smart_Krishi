package com.smartkrishi.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {
    @NotBlank(message = "Google Token is required")
    private String token;
    
    private String userType; // BUYER or SELLER (optional, used if registering)
}
