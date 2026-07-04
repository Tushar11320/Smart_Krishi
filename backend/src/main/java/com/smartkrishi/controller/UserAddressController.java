package com.smartkrishi.controller;

import com.smartkrishi.dto.address.UserAddressDTO;
import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.address.UserAddressService;
import com.smartkrishi.exception.BadRequestException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@AllArgsConstructor
@Tag(name = "User Addresses", description = "APIs for managing user addresses")
public class UserAddressController {

    private final UserAddressService addressService;

    @PostMapping
    @Operation(summary = "Create new address")
    public ResponseEntity<ApiResponse<UserAddressDTO>> createAddress(
            @Valid @RequestBody UserAddressDTO addressDTO,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserAddressDTO created = addressService.createAddress(addressDTO, userPrincipal.getId());
        return new ResponseEntity<>(new ApiResponse<>(true, "Address created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update address")
    public ResponseEntity<ApiResponse<UserAddressDTO>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody UserAddressDTO addressDTO,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserAddressDTO updated = addressService.updateAddress(id, addressDTO, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Address updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete address")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        addressService.deleteAddress(id, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Address deleted successfully", null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get address by ID")
    public ResponseEntity<ApiResponse<UserAddressDTO>> getAddressById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserAddressDTO address = addressService.getAddressById(id, userPrincipal.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Address retrieved successfully", address));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all addresses for a user")
    public ResponseEntity<ApiResponse<List<UserAddressDTO>>> getUserAddresses(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (!userId.equals(userPrincipal.getId())) {
            throw new BadRequestException("Unauthorized access to user address book");
        }
        List<UserAddressDTO> addresses = addressService.getAddressesByUserId(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Addresses retrieved successfully", addresses));
    }

    @GetMapping("/user/{userId}/default")
    @Operation(summary = "Get default address for a user")
    public ResponseEntity<ApiResponse<UserAddressDTO>> getDefaultAddress(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (!userId.equals(userPrincipal.getId())) {
            throw new BadRequestException("Unauthorized access to user address book");
        }
        UserAddressDTO address = addressService.getDefaultAddress(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Default address retrieved successfully", address));
    }

    @PutMapping("/user/{userId}/default/{addressId}")
    @Operation(summary = "Set default address")
    public ResponseEntity<ApiResponse<UserAddressDTO>> setDefaultAddress(
            @PathVariable Long userId,
            @PathVariable Long addressId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (!userId.equals(userPrincipal.getId())) {
            throw new BadRequestException("Unauthorized access to user address book");
        }
        UserAddressDTO address = addressService.setDefaultAddress(userId, addressId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Default address set successfully", address));
    }
}
