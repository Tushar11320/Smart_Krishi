package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.equipment.FarmingEquipmentDTO;
import com.smartkrishi.dto.equipment.RentalBookingDTO;
import com.smartkrishi.service.equipment.FarmingEquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/equipments")
@AllArgsConstructor
@Tag(name = "Farming Equipment", description = "APIs for farming equipment catalog and rental bookings")
public class FarmingEquipmentController {

    private final FarmingEquipmentService farmingEquipmentService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new equipment listing")
    public ResponseEntity<ApiResponse<FarmingEquipmentDTO>> createEquipment(@Valid @RequestBody FarmingEquipmentDTO dto) {
        FarmingEquipmentDTO created = farmingEquipmentService.createEquipment(dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Equipment listing created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get equipment listing by ID")
    public ResponseEntity<ApiResponse<FarmingEquipmentDTO>> getEquipmentById(@PathVariable Long id) {
        FarmingEquipmentDTO equipment = farmingEquipmentService.getEquipmentById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment listing retrieved successfully", equipment));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get equipment listing by Product ID")
    public ResponseEntity<ApiResponse<FarmingEquipmentDTO>> getEquipmentByProductId(@PathVariable Long productId) {
        FarmingEquipmentDTO equipment = farmingEquipmentService.getEquipmentByProductId(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment listing retrieved successfully", equipment));
    }

    @GetMapping
    @Operation(summary = "Get all equipment listings with pagination")
    public ResponseEntity<ApiResponse<Page<FarmingEquipmentDTO>>> getAllEquipment(Pageable pageable) {
        Page<FarmingEquipmentDTO> page = farmingEquipmentService.getAllEquipment(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment listings retrieved successfully", page));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update equipment listing")
    public ResponseEntity<ApiResponse<FarmingEquipmentDTO>> updateEquipment(
            @PathVariable Long id,
            @Valid @RequestBody FarmingEquipmentDTO dto) {
        FarmingEquipmentDTO updated = farmingEquipmentService.updateEquipment(id, dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment listing updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Delete equipment listing")
    public ResponseEntity<ApiResponse<Void>> deleteEquipment(@PathVariable Long id) {
        farmingEquipmentService.deleteEquipment(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment listing deleted successfully", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter equipment listings")
    public ResponseEntity<ApiResponse<Page<FarmingEquipmentDTO>>> searchEquipment(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Boolean forSale,
            @RequestParam(required = false) Boolean forRent,
            @RequestParam(required = false) BigDecimal maxPrice,
            Pageable pageable) {
        Page<FarmingEquipmentDTO> page = farmingEquipmentService.getEquipmentFiltered(
                keyword, brand, condition, forSale, forRent, maxPrice, pageable
        );
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment search executed successfully", page));
    }

    // Rental slots and bookings endpoints
    @PostMapping("/rent")
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Book a rental slot for equipment")
    public ResponseEntity<ApiResponse<RentalBookingDTO>> bookRental(@Valid @RequestBody RentalBookingDTO dto) {
        RentalBookingDTO booking = farmingEquipmentService.bookRental(dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Rental slot booked successfully", booking), HttpStatus.CREATED);
    }

    @GetMapping("/bookings/buyer/{buyerId}")
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Get bookings list for buyer")
    public ResponseEntity<ApiResponse<List<RentalBookingDTO>>> getBookingsByBuyer(@PathVariable Long buyerId) {
        List<RentalBookingDTO> list = farmingEquipmentService.getBookingsByBuyerId(buyerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Buyer bookings retrieved successfully", list));
    }

    @GetMapping("/bookings/seller/{sellerId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Get rental requests for seller")
    public ResponseEntity<ApiResponse<List<RentalBookingDTO>>> getBookingsBySeller(@PathVariable Long sellerId) {
        List<RentalBookingDTO> list = farmingEquipmentService.getBookingsBySellerId(sellerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller rental reservations retrieved successfully", list));
    }

    @GetMapping("/bookings/equipment/{equipmentId}")
    @Operation(summary = "Get active bookings for rental availability schedule calendar check")
    public ResponseEntity<ApiResponse<List<RentalBookingDTO>>> getBookingsByEquipment(@PathVariable Long equipmentId) {
        List<RentalBookingDTO> list = farmingEquipmentService.getBookingsByEquipmentId(equipmentId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Equipment bookings schedule retrieved", list));
    }

    @PutMapping("/bookings/{bookingId}/status")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Approve, cancel or complete rental bookings status")
    public ResponseEntity<ApiResponse<RentalBookingDTO>> updateBookingStatus(
            @PathVariable Long bookingId,
            @RequestParam String status) {
        RentalBookingDTO updated = farmingEquipmentService.updateBookingStatus(bookingId, status);
        return ResponseEntity.ok(new ApiResponse<>(true, "Rental booking status updated successfully", updated));
    }
}
