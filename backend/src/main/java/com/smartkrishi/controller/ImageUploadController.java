package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.image.CloudinaryResponseDTO;
import com.smartkrishi.service.image.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Tag(name = "Image Uploads", description = "APIs for Cloudinary image uploads")
public class ImageUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/upload")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Upload an image to Cloudinary")
    public ResponseEntity<ApiResponse<CloudinaryResponseDTO>> uploadImage(@RequestParam("file") MultipartFile file) {
        CloudinaryResponseDTO response = cloudinaryService.uploadImage(file);
        return ResponseEntity.ok(new ApiResponse<>(true, "Image uploaded successfully", response));
    }
}
