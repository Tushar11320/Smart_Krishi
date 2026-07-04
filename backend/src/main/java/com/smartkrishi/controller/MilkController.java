package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.milk.MilkDTO;
import com.smartkrishi.service.milk.MilkService;
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
@RequestMapping("/api/milk")
@AllArgsConstructor
@Tag(name = "Milk Yields", description = "APIs for milk management")
public class MilkController {

    private final MilkService milkService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new milk listing")
    public ResponseEntity<ApiResponse<MilkDTO>> createMilk(@Valid @RequestBody MilkDTO milkDTO) {
        MilkDTO created = milkService.createMilk(milkDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Milk listing created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get milk listing by ID")
    public ResponseEntity<ApiResponse<MilkDTO>> getMilkById(@PathVariable Long id) {
        MilkDTO milk = milkService.getMilkById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milk listing retrieved successfully", milk));
    }

    @GetMapping
    @Operation(summary = "Get all milk listings with pagination")
    public ResponseEntity<ApiResponse<Page<MilkDTO>>> getAllMilks(Pageable pageable) {
        Page<MilkDTO> milks = milkService.getAllMilks(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milk listings retrieved successfully", milks));
    }

    @GetMapping("/type/{milkType}")
    @Operation(summary = "Get milk listings by type")
    public ResponseEntity<ApiResponse<Page<MilkDTO>>> getMilksByType(
            @PathVariable String milkType,
            Pageable pageable) {
        Page<MilkDTO> milks = milkService.getMilksByType(milkType, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milk listings retrieved successfully", milks));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update milk listing")
    public ResponseEntity<ApiResponse<MilkDTO>> updateMilk(
            @PathVariable Long id,
            @Valid @RequestBody MilkDTO milkDTO) {
        MilkDTO updated = milkService.updateMilk(id, milkDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milk listing updated successfully", updated));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get milk listing by Product ID")
    public ResponseEntity<ApiResponse<MilkDTO>> getMilkByProductId(@PathVariable Long productId) {
        MilkDTO milk = milkService.getMilkByProductId(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milk listing retrieved successfully", milk));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter milk listings")
    public ResponseEntity<ApiResponse<Page<MilkDTO>>> searchMilks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String milkType,
            @RequestParam(required = false) Double minFat,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            Pageable pageable) {
        Page<MilkDTO> milks = milkService.getMilksFiltered(keyword, milkType, minFat, maxPrice, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milk listings retrieved successfully", milks));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Delete milk listing")
    public ResponseEntity<ApiResponse<Void>> deleteMilk(@PathVariable Long id) {
        milkService.deleteMilk(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Milk listing deleted successfully", null));
    }
}
