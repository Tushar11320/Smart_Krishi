package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.image.CloudinaryResponseDTO;
import com.smartkrishi.dto.product.ProductImageDTO;
import com.smartkrishi.entity.Product;
import com.smartkrishi.entity.ProductImage;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.ProductImageRepository;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.service.image.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products/{id}/images")
@RequiredArgsConstructor
@Tag(name = "Product Images", description = "APIs for managing product images using Cloudinary")
public class ProductImageController {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping
    @Operation(summary = "Get all images for a product")
    public ResponseEntity<ApiResponse<List<ProductImageDTO>>> getProductImages(@PathVariable("id") Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        
        List<ProductImage> images = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        List<ProductImageDTO> dtos = images.stream().map(this::convertToDto).collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "Product images retrieved successfully", dtos));
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Transactional
    @Operation(summary = "Upload a new image and link it to the product")
    public ResponseEntity<ApiResponse<ProductImageDTO>> uploadProductImage(
            @PathVariable("id") Long productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPrimary", defaultValue = "false") Boolean isPrimary,
            @RequestParam(value = "displayOrder", defaultValue = "0") Integer displayOrder) {
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        CloudinaryResponseDTO cloudinaryResp = cloudinaryService.uploadImage(file);

        // If this image is primary, make other images of the product non-primary
        if (isPrimary) {
            List<ProductImage> existingImages = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
            for (ProductImage img : existingImages) {
                if (img.getIsPrimary()) {
                    img.setIsPrimary(false);
                    productImageRepository.save(img);
                }
            }
        }

        ProductImage productImage = new ProductImage();
        productImage.setProduct(product);
        productImage.setImageUrl(cloudinaryResp.getSecureUrl());
        productImage.setPublicId(cloudinaryResp.getPublicId());
        productImage.setIsPrimary(isPrimary);
        productImage.setDisplayOrder(displayOrder);

        ProductImage savedImage = productImageRepository.save(productImage);
        ProductImageDTO dto = convertToDto(savedImage);

        return ResponseEntity.ok(new ApiResponse<>(true, "Image uploaded and linked to product successfully", dto));
    }

    @PutMapping("/{imageId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Transactional
    @Operation(summary = "Update/replace an existing product image")
    public ResponseEntity<ApiResponse<ProductImageDTO>> updateProductImage(
            @PathVariable("id") Long productId,
            @PathVariable("imageId") Long imageId,
            @RequestParam("file") MultipartFile file) {
        
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        ProductImage productImage = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId));

        if (!productImage.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException("Image does not belong to the specified product");
        }

        // Upload new and delete old
        CloudinaryResponseDTO cloudinaryResp = cloudinaryService.updateImage(file, productImage.getPublicId());

        productImage.setImageUrl(cloudinaryResp.getSecureUrl());
        productImage.setPublicId(cloudinaryResp.getPublicId());

        ProductImage savedImage = productImageRepository.save(productImage);
        ProductImageDTO dto = convertToDto(savedImage);

        return ResponseEntity.ok(new ApiResponse<>(true, "Image updated successfully", dto));
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Transactional
    @Operation(summary = "Remove an image from the database and Cloudinary")
    public ResponseEntity<ApiResponse<Void>> deleteProductImage(
            @PathVariable("id") Long productId,
            @PathVariable("imageId") Long imageId) {
        
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        ProductImage productImage = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId));

        if (!productImage.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException("Image does not belong to the specified product");
        }

        // Delete from Cloudinary
        cloudinaryService.deleteImage(productImage.getPublicId());

        // Delete from DB
        productImageRepository.delete(productImage);

        return ResponseEntity.ok(new ApiResponse<>(true, "Image deleted successfully", null));
    }

    private ProductImageDTO convertToDto(ProductImage img) {
        return ProductImageDTO.builder()
                .id(img.getId())
                .imageUrl(img.getImageUrl())
                .publicId(img.getPublicId())
                .isPrimary(img.getIsPrimary())
                .displayOrder(img.getDisplayOrder())
                .build();
    }
}
