package com.smartkrishi.controller;

import com.smartkrishi.dto.auth.UserResponse;
import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.entity.User;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

import com.smartkrishi.dto.auth.UpdateProfileRequest;
import com.smartkrishi.dto.auth.ChangePasswordRequest;
import com.smartkrishi.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import com.smartkrishi.exception.BadRequestException;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
@Tag(name = "Users Control System", description = "Admin administration APIs for user list and governance")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PutMapping("/profile")
    @Operation(summary = "Update user profile details")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request) {
        
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required");
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setProfileImage(request.getProfileImage());

        User saved = userRepository.save(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated successfully", mapUserToResponse(saved)));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change user password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request) {
        
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New passwords do not match");
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>(true, "Password updated successfully", null));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get list of all users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> list = userRepository.findAll().stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "All users retrieved successfully", list));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle block status of user account")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        try {
            user.setUserStatus(User.UserStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new com.smartkrishi.exception.BadRequestException("Invalid user status: " + status);
        }
        
        User saved = userRepository.save(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "User status updated successfully", mapUserToResponse(saved)));
    }

    private UserResponse mapUserToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImage(user.getProfileImage())
                .userStatus(user.getUserStatus() != null ? user.getUserStatus().name() : "ACTIVE")
                .emailVerified(user.getEmailVerified())
                .phoneVerified(user.getPhoneVerified())
                .roles(user.getRoles().stream()
                        .map(role -> role.getRoleType().name())
                        .collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
