package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.fertilizer.FertilizerDTO;
import com.smartkrishi.service.fertilizer.FertilizerService;
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
@RequestMapping("/api/fertilizers")
@AllArgsConstructor
@Tag(name = "Fertilizers", description = "APIs for fertilizer management")
public class FertilizerController {

    private final FertilizerService fertilizerService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new fertilizer listing")
    public ResponseEntity<ApiResponse<FertilizerDTO>> createFertilizer(@Valid @RequestBody FertilizerDTO fertilizerDTO) {
        FertilizerDTO created = fertilizerService.createFertilizer(fertilizerDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Fertilizer listing created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get fertilizer listing by ID")
    public ResponseEntity<ApiResponse<FertilizerDTO>> getFertilizerById(@PathVariable Long id) {
        FertilizerDTO fertilizer = fertilizerService.getFertilizerById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Fertilizer listing retrieved successfully", fertilizer));
    }

    @GetMapping
    @Operation(summary = "Get all fertilizer listings with pagination")
    public ResponseEntity<ApiResponse<Page<FertilizerDTO>>> getAllFertilizers(Pageable pageable) {
        Page<FertilizerDTO> fertilizers = fertilizerService.getAllFertilizers(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Fertilizer listings retrieved successfully", fertilizers));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update fertilizer listing")
    public ResponseEntity<ApiResponse<FertilizerDTO>> updateFertilizer(
            @PathVariable Long id,
            @Valid @RequestBody FertilizerDTO fertilizerDTO) {
        FertilizerDTO updated = fertilizerService.updateFertilizer(id, fertilizerDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Fertilizer listing updated successfully", updated));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get fertilizer listing by Product ID")
    public ResponseEntity<ApiResponse<FertilizerDTO>> getFertilizerByProductId(@PathVariable Long productId) {
        FertilizerDTO fertilizer = fertilizerService.getFertilizerByProductId(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Fertilizer listing retrieved successfully", fertilizer));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter fertilizer listings")
    public ResponseEntity<ApiResponse<Page<FertilizerDTO>>> searchFertilizers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            Pageable pageable) {
        Page<FertilizerDTO> fertilizers = fertilizerService.getFertilizersFiltered(keyword, brand, maxPrice, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Fertilizer listings retrieved successfully", fertilizers));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Delete fertilizer listing")
    public ResponseEntity<ApiResponse<Void>> deleteFertilizer(@PathVariable Long id) {
        fertilizerService.deleteFertilizer(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Fertilizer listing deleted successfully", null));
    }
}
