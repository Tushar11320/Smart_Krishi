package com.smartkrishi.service.milk;

import com.smartkrishi.dto.milk.MilkDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MilkService {
    MilkDTO createMilk(MilkDTO milkDTO);
    MilkDTO getMilkById(Long id);
    Page<MilkDTO> getAllMilks(Pageable pageable);
    Page<MilkDTO> getMilksByType(String milkType, Pageable pageable);
    MilkDTO updateMilk(Long id, MilkDTO milkDTO);
    void deleteMilk(Long id);
    MilkDTO getMilkByProductId(Long productId);
    Page<MilkDTO> getMilksFiltered(String keyword, String milkType, Double minFat, java.math.BigDecimal maxPrice, Pageable pageable);
}
