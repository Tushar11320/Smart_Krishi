package com.smartkrishi.service.image;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.smartkrishi.dto.image.CloudinaryResponseDTO;
import com.smartkrishi.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;
    
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");

    @Override
    public CloudinaryResponseDTO uploadImage(MultipartFile file) {
        validateFile(file);

        try {
            log.info("Uploading file to Cloudinary: name={}, size={}", file.getOriginalFilename(), file.getSize());
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "smartkrishi/products"
            ));

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");
            String format = (String) uploadResult.get("format");
            Integer width = (Integer) uploadResult.get("width");
            Integer height = (Integer) uploadResult.get("height");

            log.info("Successfully uploaded image to Cloudinary. publicId={}, url={}", publicId, secureUrl);

            return CloudinaryResponseDTO.builder()
                    .secureUrl(secureUrl)
                    .publicId(publicId)
                    .format(format)
                    .width(width)
                    .height(height)
                    .build();

        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new RuntimeException("Failed to upload image to Cloudinary: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteImage(String publicId) {
        if (publicId == null || publicId.trim().isEmpty()) {
            return;
        }
        try {
            log.info("Deleting file from Cloudinary: publicId={}", publicId);
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Cloudinary destroy result: {}", result);
        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary: publicId={}", publicId, e);
            throw new RuntimeException("Failed to delete image from Cloudinary: " + e.getMessage(), e);
        }
    }

    @Override
    public CloudinaryResponseDTO updateImage(MultipartFile file, String oldPublicId) {
        if (oldPublicId != null && !oldPublicId.trim().isEmpty()) {
            deleteImage(oldPublicId);
        }
        return uploadImage(file);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty or not provided");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds maximum limit of 10MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new BadRequestException("Invalid filename");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported file extension. Allowed extensions are: " + ALLOWED_EXTENSIONS);
        }
    }
}
