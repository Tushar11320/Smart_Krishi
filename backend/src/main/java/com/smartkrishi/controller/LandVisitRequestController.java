package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.land.LandVisitRequestDTO;
import com.smartkrishi.service.land.LandVisitRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/land-listings/visits")
@RequiredArgsConstructor
@Tag(name = "Land Visit Requests", description = "APIs for scheduling and managing land site visits")
public class LandVisitRequestController {

    private final LandVisitRequestService visitRequestService;

    @PostMapping
    @PreAuthorize("hasRole('BUYER') or hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Submit a new land visit request / inquiry")
    public ResponseEntity<ApiResponse<LandVisitRequestDTO>> createVisitRequest(@Valid @RequestBody LandVisitRequestDTO dto) {
        LandVisitRequestDTO created = visitRequestService.createVisitRequest(dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Land visit request submitted successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/buyer/{buyerId}")
    @PreAuthorize("hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Get all visit requests submitted by a buyer")
    public ResponseEntity<ApiResponse<List<LandVisitRequestDTO>>> getRequestsByBuyer(@PathVariable Long buyerId) {
        List<LandVisitRequestDTO> requests = visitRequestService.getRequestsByBuyer(buyerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Visit requests retrieved successfully", requests));
    }

    @GetMapping("/seller/{sellerId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Get all visit requests received by a seller")
    public ResponseEntity<ApiResponse<List<LandVisitRequestDTO>>> getRequestsBySeller(@PathVariable Long sellerId) {
        List<LandVisitRequestDTO> requests = visitRequestService.getRequestsBySeller(sellerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Visit requests retrieved successfully", requests));
    }

    @GetMapping("/listing/{listingId}")
    @Operation(summary = "Get all visit requests for a specific land listing")
    public ResponseEntity<ApiResponse<List<LandVisitRequestDTO>>> getRequestsByListing(@PathVariable Long listingId) {
        List<LandVisitRequestDTO> requests = visitRequestService.getRequestsByListing(listingId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Visit requests retrieved successfully", requests));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update status of a visit request (APPROVED, CANCELLED, COMPLETED)")
    public ResponseEntity<ApiResponse<LandVisitRequestDTO>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        LandVisitRequestDTO updated = visitRequestService.updateStatus(id, status);
        return ResponseEntity.ok(new ApiResponse<>(true, "Visit request status updated successfully", updated));
    }
}
