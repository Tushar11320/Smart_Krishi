package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.crop.CropDTO;
import com.smartkrishi.service.crop.CropService;
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

@RestController
@RequestMapping("/api/crops")
@AllArgsConstructor
@Tag(name = "Crops", description = "APIs for crop management")
public class CropController {

    private final CropService cropService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new crop")
    public ResponseEntity<ApiResponse<CropDTO>> createCrop(@Valid @RequestBody CropDTO cropDTO) {
        CropDTO created = cropService.createCrop(cropDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Crop created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get crop by ID")
    public ResponseEntity<ApiResponse<CropDTO>> getCropById(@PathVariable Long id) {
        CropDTO crop = cropService.getCropById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Crop retrieved successfully", crop));
    }

    @GetMapping
    @Operation(summary = "Get all crops with pagination")
    public ResponseEntity<ApiResponse<Page<CropDTO>>> getAllCrops(Pageable pageable) {
        Page<CropDTO> crops = cropService.getAllCrops(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Crops retrieved successfully", crops));
    }

    @GetMapping("/type/{cropType}")
    @Operation(summary = "Get crops by type")
    public ResponseEntity<ApiResponse<Page<CropDTO>>> getCropsByType(
            @PathVariable String cropType,
            Pageable pageable) {
        Page<CropDTO> crops = cropService.getCropsByType(cropType, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Crops retrieved successfully", crops));
    }

    @GetMapping("/season/{season}")
    @Operation(summary = "Get crops by growing season")
    public ResponseEntity<ApiResponse<Page<CropDTO>>> getCropsBySeason(
            @PathVariable String season,
            Pageable pageable) {
        Page<CropDTO> crops = cropService.getCropsBySeason(season, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Crops retrieved successfully", crops));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update crop")
    public ResponseEntity<ApiResponse<CropDTO>> updateCrop(
            @PathVariable Long id,
            @Valid @RequestBody CropDTO cropDTO) {
        CropDTO updated = cropService.updateCrop(id, cropDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Crop updated successfully", updated));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter crops listings")
    public ResponseEntity<ApiResponse<Page<CropDTO>>> searchCrops(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            Pageable pageable) {
        Page<CropDTO> crops = cropService.getCropsFiltered(keyword, state, minPrice, maxPrice, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Crops retrieved successfully", crops));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get crop by Product ID")
    public ResponseEntity<ApiResponse<CropDTO>> getCropByProductId(@PathVariable Long productId) {
        CropDTO crop = cropService.getCropByProductId(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Crop retrieved successfully", crop));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Delete crop")
    public ResponseEntity<ApiResponse<Void>> deleteCrop(@PathVariable Long id) {
        cropService.deleteCrop(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Crop deleted successfully", null));
    }
}
