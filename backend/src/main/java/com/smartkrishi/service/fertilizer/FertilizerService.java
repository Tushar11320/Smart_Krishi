package com.smartkrishi.service.fertilizer;

import com.smartkrishi.dto.fertilizer.FertilizerDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FertilizerService {
    FertilizerDTO createFertilizer(FertilizerDTO fertilizerDTO);
    FertilizerDTO getFertilizerById(Long id);
    Page<FertilizerDTO> getAllFertilizers(Pageable pageable);
    FertilizerDTO updateFertilizer(Long id, FertilizerDTO fertilizerDTO);
    void deleteFertilizer(Long id);
    FertilizerDTO getFertilizerByProductId(Long productId);
    Page<FertilizerDTO> getFertilizersFiltered(String keyword, String brand, java.math.BigDecimal maxPrice, Pageable pageable);
}
