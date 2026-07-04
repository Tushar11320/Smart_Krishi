package com.smartkrishi.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String profileImage;
    private String userStatus;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private String authProvider;
    private Set<String> roles;
    private LocalDateTime createdAt;
}
