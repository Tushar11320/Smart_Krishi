package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.machinery.MachineryDTO;
import com.smartkrishi.dto.machinery.MachineryRentalBookingDTO;
import com.smartkrishi.service.machinery.MachineryService;
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
@RequestMapping("/api/machinery")
@AllArgsConstructor
@Tag(name = "Machinery", description = "APIs for agricultural machinery management and rental bookings")
public class MachineryController {

    private final MachineryService machineryService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create new machinery")
    public ResponseEntity<ApiResponse<MachineryDTO>> createMachinery(@Valid @RequestBody MachineryDTO machineryDTO) {
        MachineryDTO created = machineryService.createMachinery(machineryDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Machinery created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get machinery by ID")
    public ResponseEntity<ApiResponse<MachineryDTO>> getMachineryById(@PathVariable Long id) {
        MachineryDTO machinery = machineryService.getMachineryById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery retrieved successfully", machinery));
    }

    @GetMapping
    @Operation(summary = "Get all machinery with pagination")
    public ResponseEntity<ApiResponse<Page<MachineryDTO>>> getAllMachinery(Pageable pageable) {
        Page<MachineryDTO> machinery = machineryService.getAllMachinery(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery retrieved successfully", machinery));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get machinery by type")
    public ResponseEntity<ApiResponse<Page<MachineryDTO>>> getMachineryByType(
            @PathVariable String type,
            Pageable pageable) {
        Page<MachineryDTO> machinery = machineryService.getMachineryByType(type, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery retrieved successfully", machinery));
    }

    @GetMapping("/brand/{brand}")
    @Operation(summary = "Get machinery by brand")
    public ResponseEntity<ApiResponse<Page<MachineryDTO>>> getMachineryByBrand(
            @PathVariable String brand,
            Pageable pageable) {
        Page<MachineryDTO> machinery = machineryService.getMachineryByBrand(brand, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery retrieved successfully", machinery));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update machinery")
    public ResponseEntity<ApiResponse<MachineryDTO>> updateMachinery(
            @PathVariable Long id,
            @Valid @RequestBody MachineryDTO machineryDTO) {
        MachineryDTO updated = machineryService.updateMachinery(id, machineryDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Delete machinery")
    public ResponseEntity<ApiResponse<Void>> deleteMachinery(@PathVariable Long id) {
        machineryService.deleteMachinery(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery deleted successfully", null));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get machinery listing by Product ID")
    public ResponseEntity<ApiResponse<MachineryDTO>> getMachineryByProductId(@PathVariable Long productId) {
        MachineryDTO machinery = machineryService.getMachineryByProductId(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery listing retrieved successfully", machinery));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter machinery listings")
    public ResponseEntity<ApiResponse<Page<MachineryDTO>>> searchMachinery(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Boolean forSale,
            @RequestParam(required = false) Boolean forRent,
            @RequestParam(required = false) BigDecimal maxPrice,
            Pageable pageable) {
        Page<MachineryDTO> page = machineryService.getMachineryFiltered(
                keyword, brand, category, state, condition, forSale, forRent, maxPrice, pageable
        );
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery search executed successfully", page));
    }

    // Rental slots and bookings endpoints
    @PostMapping("/rent")
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Book a rental slot for machinery")
    public ResponseEntity<ApiResponse<MachineryRentalBookingDTO>> bookRental(@Valid @RequestBody MachineryRentalBookingDTO dto) {
        MachineryRentalBookingDTO booking = machineryService.bookRental(dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Rental slot booked successfully", booking), HttpStatus.CREATED);
    }

    @GetMapping("/bookings/buyer/{buyerId}")
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Get bookings list for buyer")
    public ResponseEntity<ApiResponse<List<MachineryRentalBookingDTO>>> getBookingsByBuyer(@PathVariable Long buyerId) {
        List<MachineryRentalBookingDTO> list = machineryService.getBookingsByBuyerId(buyerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Buyer bookings retrieved successfully", list));
    }

    @GetMapping("/bookings/seller/{sellerId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Get rental requests for seller")
    public ResponseEntity<ApiResponse<List<MachineryRentalBookingDTO>>> getBookingsBySeller(@PathVariable Long sellerId) {
        List<MachineryRentalBookingDTO> list = machineryService.getBookingsBySellerId(sellerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller rental reservations retrieved successfully", list));
    }

    @GetMapping("/bookings/machinery/{machineryId}")
    @Operation(summary = "Get active bookings for rental availability schedule calendar check")
    public ResponseEntity<ApiResponse<List<MachineryRentalBookingDTO>>> getBookingsByMachinery(@PathVariable Long machineryId) {
        List<MachineryRentalBookingDTO> list = machineryService.getBookingsByMachineryId(machineryId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Machinery bookings schedule retrieved", list));
    }

    @PutMapping("/bookings/{bookingId}/status")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Approve, cancel or complete rental bookings status")
    public ResponseEntity<ApiResponse<MachineryRentalBookingDTO>> updateBookingStatus(
            @PathVariable Long bookingId,
            @RequestParam String status) {
        MachineryRentalBookingDTO updated = machineryService.updateBookingStatus(bookingId, status);
        return ResponseEntity.ok(new ApiResponse<>(true, "Rental booking status updated successfully", updated));
    }
}
