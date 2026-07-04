package com.smartkrishi.repository;

import com.smartkrishi.entity.LandVisitRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LandVisitRequestRepository extends JpaRepository<LandVisitRequest, Long> {
    
    List<LandVisitRequest> findByLandListingSellerId(Long sellerId);
    
    List<LandVisitRequest> findByBuyerId(Long buyerId);
    
    List<LandVisitRequest> findByLandListingId(Long landListingId);
}
