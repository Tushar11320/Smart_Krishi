package com.smartkrishi.service.seller;

import com.smartkrishi.dto.product.ProductDTO;
import com.smartkrishi.dto.land.LandListingDTO;
import com.smartkrishi.dto.seller.SellerInventoryStatsDTO;

import java.util.List;

public interface SellerListingService {
    
    SellerInventoryStatsDTO getSellerInventoryStats(Long sellerUserId);
    
    ProductDTO toggleProductStatus(Long productId, String status, Long sellerUserId);
    
    ProductDTO updateProductStock(Long productId, Integer quantity, Integer reorderLevel, Long sellerUserId);
    
    void bulkUpdateStatus(List<Long> productIds, String status, Long sellerUserId);
    
    void bulkUpdateStock(List<Long> productIds, Integer quantity, Long sellerUserId);
    
    LandListingDTO toggleLandStatus(Long landId, String status, Long sellerUserId);
    
    void bulkUpdateLandStatus(List<Long> landIds, String status, Long sellerUserId);
}
