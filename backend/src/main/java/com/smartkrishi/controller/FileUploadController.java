package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@Slf4j
@Tag(name = "File Uploads", description = "APIs for file uploads")
public class FileUploadController {

    private static final String UPLOAD_DIR = "uploads";

    @PostMapping("/upload")
    @Operation(summary = "Upload a file locally")
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "File is empty", null));
        }

        try {
            // Create uploads directory if it does not exist
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Generate a secure unique filename
            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String newFileName = UUID.randomUUID().toString() + extension;

            // Save file
            Path path = Paths.get(UPLOAD_DIR, newFileName);
            Files.write(path, file.getBytes());

            log.info("File uploaded successfully: {} -> {}", originalFileName, newFileName);

            // Construct local static serving URL (relative to context-path /api)
            String fileUrl = "/api/uploads/" + newFileName;

            return ResponseEntity.ok(new ApiResponse<>(true, "File uploaded successfully", fileUrl));
        } catch (IOException e) {
            log.error("Failed to store file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to upload file: " + e.getMessage(), null));
        }
    }
}
