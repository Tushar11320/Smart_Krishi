package com.smartkrishi.service.crop;

import com.smartkrishi.dto.crop.CropDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CropService {
    CropDTO createCrop(CropDTO cropDTO);
    CropDTO getCropById(Long id);
    Page<CropDTO> getAllCrops(Pageable pageable);
    Page<CropDTO> getCropsByType(String cropType, Pageable pageable);
    Page<CropDTO> getCropsBySeason(String season, Pageable pageable);
    CropDTO updateCrop(Long id, CropDTO cropDTO);
    void deleteCrop(Long id);
    CropDTO getCropByProductId(Long productId);
    Page<CropDTO> getCropsFiltered(String keyword, String state, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, Pageable pageable);
}
