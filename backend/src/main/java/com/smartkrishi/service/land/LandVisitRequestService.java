package com.smartkrishi.service.land;

import com.smartkrishi.dto.land.LandVisitRequestDTO;

import java.util.List;

public interface LandVisitRequestService {
    LandVisitRequestDTO createVisitRequest(LandVisitRequestDTO dto);
    List<LandVisitRequestDTO> getRequestsBySeller(Long sellerId);
    List<LandVisitRequestDTO> getRequestsByBuyer(Long buyerId);
    List<LandVisitRequestDTO> getRequestsByListing(Long listingId);
    LandVisitRequestDTO updateStatus(Long id, String status);
}
