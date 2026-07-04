package com.smartkrishi.controller;

import com.smartkrishi.dto.category.CategoryDTO;
import com.smartkrishi.dto.category.SubCategoryDTO;
import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.service.category.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@AllArgsConstructor
@Tag(name = "Categories", description = "APIs for product category management")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new category")
    public ResponseEntity<ApiResponse<CategoryDTO>> createCategory(@Valid @RequestBody CategoryDTO categoryDTO) {
        CategoryDTO created = categoryService.createCategory(categoryDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Category created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID")
    public ResponseEntity<ApiResponse<CategoryDTO>> getCategoryById(@PathVariable Long id) {
        CategoryDTO category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category retrieved successfully", category));
    }

    @GetMapping
    @Operation(summary = "Get all categories")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getAllCategories() {
        List<CategoryDTO> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(new ApiResponse<>(true, "Categories retrieved successfully", categories));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get category by slug")
    public ResponseEntity<ApiResponse<CategoryDTO>> getCategoryBySlug(@PathVariable String slug) {
        CategoryDTO category = categoryService.getCategoryBySlug(slug);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category retrieved successfully", category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update category")
    public ResponseEntity<ApiResponse<CategoryDTO>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryDTO categoryDTO) {
        CategoryDTO updated = categoryService.updateCategory(id, categoryDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category deleted successfully", null));
    }

    @PostMapping("/{categoryId}/subcategories")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new subcategory")
    public ResponseEntity<ApiResponse<SubCategoryDTO>> createSubCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody SubCategoryDTO subCategoryDTO) {
        SubCategoryDTO created = categoryService.createSubCategory(categoryId, subCategoryDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Subcategory created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{categoryId}/subcategories")
    @Operation(summary = "Get all subcategories for a category")
    public ResponseEntity<ApiResponse<List<SubCategoryDTO>>> getSubCategoriesByCategory(@PathVariable Long categoryId) {
        List<SubCategoryDTO> subCategories = categoryService.getSubCategoriesByCategory(categoryId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Subcategories retrieved successfully", subCategories));
    }

    @GetMapping("/subcategories/{id}")
    @Operation(summary = "Get subcategory by ID")
    public ResponseEntity<ApiResponse<SubCategoryDTO>> getSubCategoryById(@PathVariable Long id) {
        SubCategoryDTO subCategory = categoryService.getSubCategoryById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Subcategory retrieved successfully", subCategory));
    }

    @PutMapping("/subcategories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update subcategory")
    public ResponseEntity<ApiResponse<SubCategoryDTO>> updateSubCategory(
            @PathVariable Long id,
            @Valid @RequestBody SubCategoryDTO subCategoryDTO) {
        SubCategoryDTO updated = categoryService.updateSubCategory(id, subCategoryDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Subcategory updated successfully", updated));
    }

    @DeleteMapping("/subcategories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete subcategory")
    public ResponseEntity<ApiResponse<Void>> deleteSubCategory(@PathVariable Long id) {
        categoryService.deleteSubCategory(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Subcategory deleted successfully", null));
    }
}
