package com.smartkrishi.controller;

import com.smartkrishi.dto.product.ProductDTO;
import com.smartkrishi.service.product.ProductService;
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

import java.util.List;

@RestController
@RequestMapping("/api/products")
@AllArgsConstructor
@Tag(name = "Products", description = "Product catalog management APIs")
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new product")
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        return new ResponseEntity<>(productService.createProduct(productDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        return new ResponseEntity<>(productService.getProductById(id), HttpStatus.OK);
    }

    @GetMapping
    @Operation(summary = "Get all products with pagination")
    public ResponseEntity<Page<ProductDTO>> getAllProducts(Pageable pageable) {
        return new ResponseEntity<>(productService.getAllProducts(pageable), HttpStatus.OK);
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get products by category")
    public ResponseEntity<Page<ProductDTO>> getProductsByCategory(
            @PathVariable Long categoryId,
            Pageable pageable) {
        return new ResponseEntity<>(productService.getProductsByCategory(categoryId, pageable), HttpStatus.OK);
    }

    @GetMapping("/subcategory/{subcategoryId}")
    @Operation(summary = "Get products by subcategory")
    public ResponseEntity<Page<ProductDTO>> getProductsBySubcategory(
            @PathVariable Long subcategoryId,
            Pageable pageable) {
        return new ResponseEntity<>(productService.getProductsBySubcategory(subcategoryId, pageable), HttpStatus.OK);
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "Get products by seller")
    public ResponseEntity<Page<ProductDTO>> getProductsBySeller(
            @PathVariable Long sellerId,
            Pageable pageable) {
        return new ResponseEntity<>(productService.getProductsBySeller(sellerId, pageable), HttpStatus.OK);
    }

    @GetMapping("/seller/{sellerId}/all")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Get all products by seller (including drafts/inactive)")
    public ResponseEntity<Page<ProductDTO>> getSellerProductsAll(
            @PathVariable Long sellerId,
            Pageable pageable) {
        return new ResponseEntity<>(productService.getSellerProductsAll(sellerId, pageable), HttpStatus.OK);
    }

    @GetMapping("/search")
    @Operation(summary = "Search products by keyword")
    public ResponseEntity<Page<ProductDTO>> searchProducts(
            @RequestParam String keyword,
            Pageable pageable) {
        return new ResponseEntity<>(productService.searchProducts(keyword, pageable), HttpStatus.OK);
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured products")
    public ResponseEntity<List<ProductDTO>> getFeaturedProducts() {
        return new ResponseEntity<>(productService.getFeaturedProducts(), HttpStatus.OK);
    }

    @GetMapping("/bestsellers")
    @Operation(summary = "Get bestseller products")
    public ResponseEntity<List<ProductDTO>> getBestsellers() {
        return new ResponseEntity<>(productService.getBestsellers(), HttpStatus.OK);
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Get product by SKU")
    public ResponseEntity<ProductDTO> getProductBySku(@PathVariable String sku) {
        return new ResponseEntity<>(productService.getProductBySku(sku), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update product")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO productDTO) {
        return new ResponseEntity<>(productService.updateProduct(id, productDTO), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Delete product")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all products regardless of status (Admin only)")
    public ResponseEntity<Page<ProductDTO>> getAllProductsAdmin(Pageable pageable) {
        return new ResponseEntity<>(productService.getAllProductsAdmin(pageable), HttpStatus.OK);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Moderate product status (Admin only)")
    public ResponseEntity<ProductDTO> updateProductStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return new ResponseEntity<>(productService.updateProductStatus(id, status), HttpStatus.OK);
    }

    @GetMapping("/nearby")
    @Operation(summary = "Get products nearby a set of coordinates")
    public ResponseEntity<List<ProductDTO>> getNearbyProducts(
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon,
            @RequestParam(value = "radius", defaultValue = "10") double radius,
            @RequestParam(value = "sortBy", defaultValue = "distance") String sortBy) {
        return new ResponseEntity<>(productService.getNearbyProducts(lat, lon, radius, sortBy), HttpStatus.OK);
    }
}
