package com.smartkrishi.service.seller;

import com.smartkrishi.dto.seller.SellerDashboardStatsDTO;
import com.smartkrishi.dto.seller.SellerProfileDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SellerProfileService {
    SellerProfileDTO createSellerProfile(SellerProfileDTO sellerProfileDTO);
    SellerProfileDTO getSellerProfileById(Long id);
    SellerProfileDTO getSellerProfileByUserId(Long userId);
    Page<SellerProfileDTO> getAllSellerProfiles(Pageable pageable);
    Page<SellerProfileDTO> getVerifiedSellers(Pageable pageable);
    Page<SellerProfileDTO> getTopRatedSellers(Pageable pageable);
    SellerProfileDTO updateSellerProfile(Long id, SellerProfileDTO sellerProfileDTO);
    SellerProfileDTO approveSellerProfile(Long id);
    SellerProfileDTO rejectSellerProfile(Long id, String reason);
    SellerProfileDTO submitOnboarding(Long userId, SellerProfileDTO sellerProfileDTO);
    SellerProfileDTO suspendSellerProfile(Long id, String reason);
    void deleteSellerProfile(Long id);
    SellerDashboardStatsDTO getDashboardStats(Long sellerId);
}
