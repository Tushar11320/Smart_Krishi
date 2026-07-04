package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.material.BuildingMaterialDTO;
import com.smartkrishi.service.material.BuildingMaterialService;
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

@RestController
@RequestMapping("/api/materials")
@AllArgsConstructor
@Tag(name = "Building Materials", description = "APIs for building materials marketplace management")
public class BuildingMaterialController {

    private final BuildingMaterialService buildingMaterialService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new building material listing")
    public ResponseEntity<ApiResponse<BuildingMaterialDTO>> createMaterial(@Valid @RequestBody BuildingMaterialDTO dto) {
        BuildingMaterialDTO created = buildingMaterialService.createMaterial(dto);
        return new ResponseEntity<>(new ApiResponse<>(true, "Building material listed successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get building material listing by ID")
    public ResponseEntity<ApiResponse<BuildingMaterialDTO>> getMaterialById(@PathVariable Long id) {
        BuildingMaterialDTO material = buildingMaterialService.getMaterialById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Building material retrieved successfully", material));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get building material listing by Product ID")
    public ResponseEntity<ApiResponse<BuildingMaterialDTO>> getMaterialByProductId(@PathVariable Long productId) {
        BuildingMaterialDTO material = buildingMaterialService.getMaterialByProductId(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Building material retrieved successfully", material));
    }

    @GetMapping
    @Operation(summary = "Get all building material listings with pagination")
    public ResponseEntity<ApiResponse<Page<BuildingMaterialDTO>>> getAllMaterials(Pageable pageable) {
        Page<BuildingMaterialDTO> page = buildingMaterialService.getAllMaterials(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Building materials retrieved successfully", page));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update building material listing")
    public ResponseEntity<ApiResponse<BuildingMaterialDTO>> updateMaterial(
            @PathVariable Long id,
            @Valid @RequestBody BuildingMaterialDTO dto) {
        BuildingMaterialDTO updated = buildingMaterialService.updateMaterial(id, dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "Building material listing updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Delete building material listing")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(@PathVariable Long id) {
        buildingMaterialService.deleteMaterial(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Building material deleted successfully", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter building materials")
    public ResponseEntity<ApiResponse<Page<BuildingMaterialDTO>>> searchMaterials(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String materialType,
            @RequestParam(required = false) Boolean deliveryAvailable,
            @RequestParam(required = false) BigDecimal maxPrice,
            Pageable pageable) {
        Page<BuildingMaterialDTO> page = buildingMaterialService.getMaterialsFiltered(
                keyword, materialType, deliveryAvailable, maxPrice, pageable
        );
        return ResponseEntity.ok(new ApiResponse<>(true, "Building materials search completed successfully", page));
    }
}
