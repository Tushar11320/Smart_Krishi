package com.smartkrishi.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {
    @NotBlank(message = "ID Token is required")
    private String idToken;
    
    private String userType; // BUYER or SELLER (optional, used if registering)
}
