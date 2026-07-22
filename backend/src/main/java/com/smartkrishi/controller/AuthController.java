package com.smartkrishi.controller;

import com.smartkrishi.dto.auth.*;
import com.smartkrishi.service.auth.AuthService;
import com.smartkrishi.service.image.CloudinaryService;
import com.smartkrishi.dto.image.CloudinaryResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "APIs for user authentication")
public class AuthController {

    private final AuthService authService;
    private final CloudinaryService cloudinaryService;

    @InitBinder
    public void initBinder(WebDataBinder binder) {
        // Disallow binding of profileImage from request parameters to the DTO directly
        // to prevent Spring's DataBinder from converting the MultipartFile to a String.
        binder.setDisallowedFields("profileImage");
    }

    @GetMapping("/ping")
    @Operation(summary = "Ping the backend")
    public ResponseEntity<java.util.Map<String, String>> ping() {
        log.info("[Ping] Incoming ping request");
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("status", "OK");
        response.put("message", "pong");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<UserResponse> register(
            @Valid @ModelAttribute RegisterRequest request,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImageFile
    ) {
        log.info("[Register Request] Incoming registration request: email={}, firstName={}, lastName={}, phone={}, userType={}, profileImagePresent={}",
                request.getEmail(), request.getFirstName(), request.getLastName(), request.getPhone(), request.getUserType(), (profileImageFile != null && !profileImageFile.isEmpty()));

        try {
            if (profileImageFile != null && !profileImageFile.isEmpty()) {
                // Validate supported image formats (Requirement 6: JPG, JPEG, PNG, GIF, WEBP)
                String contentType = profileImageFile.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new com.smartkrishi.exception.BadRequestException("Only image files are allowed!");
                }
                String filename = profileImageFile.getOriginalFilename();
                if (filename != null) {
                    String ext = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
                    if (!ext.matches("jpg|jpeg|png|gif|webp")) {
                        throw new com.smartkrishi.exception.BadRequestException("Supported image formats: JPG, JPEG, PNG, GIF, WEBP");
                    }
                }
                // Validate maximum image size (Requirement 6: 5MB)
                if (profileImageFile.getSize() > 5 * 1024 * 1024) {
                    throw new com.smartkrishi.exception.BadRequestException("Maximum image size is 5MB");
                }

                try {
                    CloudinaryResponseDTO uploadResult = cloudinaryService.uploadImage(profileImageFile);
                    request.setProfileImage(uploadResult.getSecureUrl());
                } catch (Exception e) {
                    throw new com.smartkrishi.exception.BadRequestException("Failed to upload profile photo to Cloudinary: " + e.getMessage());
                }
            } else {
                // Default initials avatar (Requirement 8)
                String initials = ((request.getFirstName() != null && !request.getFirstName().isEmpty() ? request.getFirstName().substring(0, 1) : "") +
                                   (request.getLastName() != null && !request.getLastName().isEmpty() ? request.getLastName().substring(0, 1) : "")).toUpperCase();
                request.setProfileImage("https://placehold.co/150x150/16a34a/ffffff?text=" + (initials.isEmpty() ? "User" : initials));
            }
            
            log.info("[Register Request] Executing registration service for: {}", request.getEmail());
            UserResponse response = authService.register(request);
            log.info("[Register Request] User registered successfully: {}", request.getEmail());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("[Register Request ERROR] Registration failed for user: {}. Full stack trace: ", request.getEmail(), e);
            throw e;
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Login user")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return new ResponseEntity<>(authService.login(request), HttpStatus.OK);
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh JWT token")
    public ResponseEntity<JwtResponse> refreshToken(@RequestHeader("Authorization") String token) {
        String refreshToken = token.substring(7); // Remove "Bearer " prefix
        return new ResponseEntity<>(authService.refreshToken(refreshToken), HttpStatus.OK);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String token) {
        authService.logout(token);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return new ResponseEntity<>(authService.getCurrentUser(), HttpStatus.OK);
    }

    @PostMapping("/google")
    @Operation(summary = "Login or register with Google OAuth 2.0")
    public ResponseEntity<JwtResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return new ResponseEntity<>(authService.googleLogin(request), HttpStatus.OK);
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify account email with 6-digit OTP")
    public ResponseEntity<UserResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return new ResponseEntity<>(authService.verifyOtp(request), HttpStatus.OK);
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP verification email")
    public ResponseEntity<Void> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendOtp(request);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
