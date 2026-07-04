package com.smartkrishi.service.image;

import com.smartkrishi.dto.image.CloudinaryResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
    CloudinaryResponseDTO uploadImage(MultipartFile file);
    void deleteImage(String publicId);
    CloudinaryResponseDTO updateImage(MultipartFile file, String oldPublicId);
}
