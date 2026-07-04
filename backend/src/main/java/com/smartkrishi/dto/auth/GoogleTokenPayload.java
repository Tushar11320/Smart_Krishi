package com.smartkrishi.dto.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleTokenPayload {
    private String iss;
    private String sub; // Google ID
    private String aud; // Client ID
    private String email;
    
    @JsonProperty("email_verified")
    private String emailVerified;
    
    private String name;
    private String picture; // Profile picture URL
    
    @JsonProperty("given_name")
    private String givenName;
    
    @JsonProperty("family_name")
    private String familyName;
}
