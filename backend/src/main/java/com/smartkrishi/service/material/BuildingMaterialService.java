package com.smartkrishi.service.material;

import com.smartkrishi.dto.material.BuildingMaterialDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface BuildingMaterialService {
    
    BuildingMaterialDTO createMaterial(BuildingMaterialDTO dto);
    
    BuildingMaterialDTO getMaterialById(Long id);
    
    BuildingMaterialDTO getMaterialByProductId(Long productId);
    
    Page<BuildingMaterialDTO> getAllMaterials(Pageable pageable);
    
    BuildingMaterialDTO updateMaterial(Long id, BuildingMaterialDTO dto);
    
    void deleteMaterial(Long id);
    
    Page<BuildingMaterialDTO> getMaterialsFiltered(
        String keyword, String materialType, Boolean deliveryAvailable, BigDecimal maxPrice, Pageable pageable
    );
}
