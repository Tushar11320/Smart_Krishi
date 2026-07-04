package com.smartkrishi.service.land;

import com.smartkrishi.dto.land.LandVisitRequestDTO;
import com.smartkrishi.entity.LandListing;
import com.smartkrishi.entity.LandVisitRequest;
import com.smartkrishi.entity.User;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.LandListingRepository;
import com.smartkrishi.repository.LandVisitRequestRepository;
import com.smartkrishi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LandVisitRequestServiceImpl implements LandVisitRequestService {

    private final LandVisitRequestRepository visitRequestRepository;
    private final LandListingRepository landListingRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public LandVisitRequestDTO createVisitRequest(LandVisitRequestDTO dto) {
        LandListing landListing = landListingRepository.findById(dto.getLandListingId())
                .orElseThrow(() -> new ResourceNotFoundException("LandListing", "id", dto.getLandListingId()));

        User buyer = userRepository.findById(dto.getBuyerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getBuyerId()));

        LandVisitRequest visitRequest = LandVisitRequest.builder()
                .landListing(landListing)
                .buyer(buyer)
                .buyerName(dto.getBuyerName())
                .buyerPhone(dto.getBuyerPhone())
                .buyerEmail(dto.getBuyerEmail())
                .visitDate(dto.getVisitDate())
                .visitTime(dto.getVisitTime())
                .message(dto.getMessage())
                .requestStatus(LandVisitRequest.RequestStatus.PENDING)
                .build();

        // Increment interest count on land listing as an inquiry has been made
        landListing.setInterestCount(landListing.getInterestCount() + 1);
        landListingRepository.save(landListing);

        LandVisitRequest saved = visitRequestRepository.save(visitRequest);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LandVisitRequestDTO> getRequestsBySeller(Long sellerId) {
        return visitRequestRepository.findByLandListingSellerId(sellerId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LandVisitRequestDTO> getRequestsByBuyer(Long buyerId) {
        return visitRequestRepository.findByBuyerId(buyerId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LandVisitRequestDTO> getRequestsByListing(Long listingId) {
        return visitRequestRepository.findByLandListingId(listingId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LandVisitRequestDTO updateStatus(Long id, String status) {
        LandVisitRequest request = visitRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LandVisitRequest", "id", id));

        request.setRequestStatus(LandVisitRequest.RequestStatus.valueOf(status.toUpperCase()));
        LandVisitRequest updated = visitRequestRepository.save(request);
        return mapToDTO(updated);
    }

    private LandVisitRequestDTO mapToDTO(LandVisitRequest request) {
        return LandVisitRequestDTO.builder()
                .id(request.getId())
                .landListingId(request.getLandListing().getId())
                .landTitle(request.getLandListing().getLandTitle())
                .buyerId(request.getBuyer().getId())
                .buyerName(request.getBuyerName())
                .buyerPhone(request.getBuyerPhone())
                .buyerEmail(request.getBuyerEmail())
                .visitDate(request.getVisitDate())
                .visitTime(request.getVisitTime())
                .message(request.getMessage())
                .requestStatus(request.getRequestStatus().name())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
