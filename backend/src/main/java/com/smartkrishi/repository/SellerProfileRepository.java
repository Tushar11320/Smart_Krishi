package com.smartkrishi.repository;

import com.smartkrishi.entity.SellerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {
    
    Optional<SellerProfile> findByUserId(Long userId);
    
    Page<SellerProfile> findBySellerStatus(SellerProfile.SellerStatus status, Pageable pageable);
    
    long countBySellerStatus(SellerProfile.SellerStatus status);
    
    @Query("SELECT s FROM SellerProfile s WHERE s.sellerStatus = 'APPROVED'")
    Page<SellerProfile> findByIsVerifiedTrue(Pageable pageable);
    
    @Query("SELECT s FROM SellerProfile s WHERE s.sellerStatus = 'APPROVED' ORDER BY s.rating DESC, s.reviewCount DESC")
    Page<SellerProfile> findTopRatedSellers(Pageable pageable);
    
    Page<SellerProfile> findAll(Pageable pageable);
}
