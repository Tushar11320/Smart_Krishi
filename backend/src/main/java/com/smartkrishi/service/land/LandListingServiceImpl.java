package com.smartkrishi.service.land;

import com.smartkrishi.dto.land.LandListingDTO;
import com.smartkrishi.dto.land.LandImageDTO;
import com.smartkrishi.entity.LandImage;
import com.smartkrishi.entity.LandListing;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.LandListingRepository;
import com.smartkrishi.repository.SellerProfileRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class LandListingServiceImpl implements LandListingService {

    private final LandListingRepository landListingRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @Override
    @Transactional
    public LandListingDTO createLandListing(LandListingDTO landListingDTO) {
        // Resolve Authenticated SellerProfile & Verify Status
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated to list land");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found for user ID: " + principal.getId()));

        if (seller.getSellerStatus() != SellerProfile.SellerStatus.APPROVED) {
            throw new com.smartkrishi.exception.BadRequestException("Cannot create land listing. Seller status is not APPROVED: " + seller.getSellerStatus());
        }

        LandListing landListing = new LandListing();
        landListing.setSeller(seller);
        landListing.setLandTitle(landListingDTO.getLandTitle());
        landListing.setDescription(landListingDTO.getDescription());
        landListing.setAreaInAcres(landListingDTO.getAreaInAcres());
        landListing.setAreaUnit(landListingDTO.getAreaUnit() != null ? landListingDTO.getAreaUnit() : "acre");
        landListing.setVillage(landListingDTO.getVillage());
        landListing.setElectricityAvailability(landListingDTO.getElectricityAvailability() != null ? landListingDTO.getElectricityAvailability() : false);
        landListing.setRoadConnectivity(landListingDTO.getRoadConnectivity());
        landListing.setDocumentUrl(landListingDTO.getDocumentUrl());
        landListing.setLandType(landListingDTO.getLandType());
        landListing.setState(landListingDTO.getState());
        landListing.setDistrict(landListingDTO.getDistrict());
        landListing.setTaluka(landListingDTO.getTaluka() != null ? landListingDTO.getTaluka() : "");
        landListing.setPinCode(landListingDTO.getPinCode() != null ? landListingDTO.getPinCode() : "");
        landListing.setLatitude(landListingDTO.getLatitude() != null ? BigDecimal.valueOf(landListingDTO.getLatitude()) : BigDecimal.ZERO);
        landListing.setLongitude(landListingDTO.getLongitude() != null ? BigDecimal.valueOf(landListingDTO.getLongitude()) : BigDecimal.ZERO);
        landListing.setPricePerAcre(landListingDTO.getPricePerAcre());
        landListing.setCurrency(landListingDTO.getCurrency() != null ? landListingDTO.getCurrency() : "INR");
        landListing.setSoilInformation(landListingDTO.getSoilInformation());
        landListing.setWaterSourceInformation(landListingDTO.getWaterSourceInformation());
        landListing.setAccessibility(landListingDTO.getAccessibility());

        LandListing.LandStatus status = LandListing.LandStatus.AVAILABLE;
        if (landListingDTO.getLandStatus() != null) {
            try {
                status = LandListing.LandStatus.valueOf(landListingDTO.getLandStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // fallback to AVAILABLE
            }
        }
        landListing.setLandStatus(status);

        // Handle images
        if (landListingDTO.getImages() != null && !landListingDTO.getImages().isEmpty()) {
            for (int i = 0; i < landListingDTO.getImages().size(); i++) {
                LandImageDTO imageDTO = landListingDTO.getImages().get(i);
                LandImage image = new LandImage();
                image.setLandListing(landListing);
                image.setImageUrl(imageDTO.getImageUrl());
                image.setPublicId(imageDTO.getPublicId());
                image.setIsPrimary(imageDTO.getIsPrimary() != null ? imageDTO.getIsPrimary() : (i == 0));
                image.setDisplayOrder(imageDTO.getDisplayOrder() != null ? imageDTO.getDisplayOrder() : i);
                landListing.getImages().add(image);
            }
        }

        LandListing saved = landListingRepository.save(landListing);
        return mapToDTO(saved);
    }

    @Override
    public LandListingDTO getLandListingById(Long id) {
        LandListing landListing = landListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LandListing", "id", id));
        return mapToDTO(landListing);
    }

    @Override
    public Page<LandListingDTO> getAllLandListings(Pageable pageable) {
        return landListingRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Override
    public Page<LandListingDTO> getLandListingsBySeller(Long sellerId, Pageable pageable) {
        return landListingRepository.findBySellerId(sellerId, pageable).map(this::mapToDTO);
    }

    @Override
    public Page<LandListingDTO> searchByLocation(String state, String district, String landType, Pageable pageable) {
        return landListingRepository.searchByLocation(state, district, landType, pageable).map(this::mapToDTO);
    }

    @Override
    public Page<LandListingDTO> searchLandListings(
            String state, String district, String landType, String soilType, String waterSource,
            Boolean electricity, String roadConnectivity, BigDecimal minPrice, BigDecimal maxPrice,
            Pageable pageable) {
        return landListingRepository.searchLandListings(
                state, district, landType, soilType, waterSource,
                electricity, roadConnectivity, minPrice, maxPrice, pageable
        ).map(this::mapToDTO);
    }

    @Override
    public Page<LandListingDTO> getLandListingsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return landListingRepository.findByPricePerAcreBetween(minPrice, maxPrice, pageable).map(this::mapToDTO);
    }

    @Override
    public Page<LandListingDTO> getLandListingsByStatus(String status, Pageable pageable) {
        LandListing.LandStatus landStatus = LandListing.LandStatus.valueOf(status.toUpperCase());
        return landListingRepository.findByLandStatus(landStatus, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public LandListingDTO updateLandListing(Long id, LandListingDTO landListingDTO) {
        LandListing landListing = landListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LandListing", "id", id));

        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (landListing.getSeller() == null || !landListing.getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        if (landListingDTO.getLandTitle() != null) {
            landListing.setLandTitle(landListingDTO.getLandTitle());
        }
        if (landListingDTO.getDescription() != null) {
            landListing.setDescription(landListingDTO.getDescription());
        }
        if (landListingDTO.getAreaInAcres() != null) {
            landListing.setAreaInAcres(landListingDTO.getAreaInAcres());
        }
        if (landListingDTO.getAreaUnit() != null) {
            landListing.setAreaUnit(landListingDTO.getAreaUnit());
        }
        if (landListingDTO.getVillage() != null) {
            landListing.setVillage(landListingDTO.getVillage());
        }
        if (landListingDTO.getElectricityAvailability() != null) {
            landListing.setElectricityAvailability(landListingDTO.getElectricityAvailability());
        }
        if (landListingDTO.getRoadConnectivity() != null) {
            landListing.setRoadConnectivity(landListingDTO.getRoadConnectivity());
        }
        if (landListingDTO.getDocumentUrl() != null) {
            landListing.setDocumentUrl(landListingDTO.getDocumentUrl());
        }
        if (landListingDTO.getLandType() != null) {
            landListing.setLandType(landListingDTO.getLandType());
        }
        if (landListingDTO.getState() != null) {
            landListing.setState(landListingDTO.getState());
        }
        if (landListingDTO.getDistrict() != null) {
            landListing.setDistrict(landListingDTO.getDistrict());
        }
        if (landListingDTO.getTaluka() != null) {
            landListing.setTaluka(landListingDTO.getTaluka());
        }
        if (landListingDTO.getPinCode() != null) {
            landListing.setPinCode(landListingDTO.getPinCode());
        }
        if (landListingDTO.getLatitude() != null) {
            landListing.setLatitude(BigDecimal.valueOf(landListingDTO.getLatitude()));
        }
        if (landListingDTO.getLongitude() != null) {
            landListing.setLongitude(BigDecimal.valueOf(landListingDTO.getLongitude()));
        }
        if (landListingDTO.getPricePerAcre() != null) {
            landListing.setPricePerAcre(landListingDTO.getPricePerAcre());
        }
        if (landListingDTO.getCurrency() != null) {
            landListing.setCurrency(landListingDTO.getCurrency());
        }
        if (landListingDTO.getSoilInformation() != null) {
            landListing.setSoilInformation(landListingDTO.getSoilInformation());
        }
        if (landListingDTO.getWaterSourceInformation() != null) {
            landListing.setWaterSourceInformation(landListingDTO.getWaterSourceInformation());
        }
        if (landListingDTO.getAccessibility() != null) {
            landListing.setAccessibility(landListingDTO.getAccessibility());
        }

        if (landListingDTO.getLandStatus() != null) {
            try {
                landListing.setLandStatus(LandListing.LandStatus.valueOf(landListingDTO.getLandStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // ignore
            }
        }

        // Handle image update - replace all images if provided
        if (landListingDTO.getImages() != null) {
            landListing.getImages().clear();
            for (int i = 0; i < landListingDTO.getImages().size(); i++) {
                LandImageDTO imageDTO = landListingDTO.getImages().get(i);
                LandImage image = new LandImage();
                image.setLandListing(landListing);
                image.setImageUrl(imageDTO.getImageUrl());
                image.setPublicId(imageDTO.getPublicId());
                image.setIsPrimary(imageDTO.getIsPrimary() != null ? imageDTO.getIsPrimary() : (i == 0));
                image.setDisplayOrder(imageDTO.getDisplayOrder() != null ? imageDTO.getDisplayOrder() : i);
                landListing.getImages().add(image);
            }
        }

        LandListing updated = landListingRepository.save(landListing);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public LandListingDTO updateLandListingStatus(Long id, String status) {
        LandListing landListing = landListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LandListing", "id", id));

        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (landListing.getSeller() == null || !landListing.getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        landListing.setLandStatus(LandListing.LandStatus.valueOf(status.toUpperCase()));
        LandListing updated = landListingRepository.save(landListing);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void incrementViewCount(Long id) {
        landListingRepository.incrementViewCount(id);
    }

    @Override
    @Transactional
    public void incrementInterestCount(Long id) {
        landListingRepository.incrementInterestCount(id);
    }

    @Override
    @Transactional
    public void deleteLandListing(Long id) {
        LandListing landListing = landListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LandListing", "id", id));

        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (landListing.getSeller() == null || !landListing.getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        landListingRepository.delete(landListing);
    }

    private LandListingDTO mapToDTO(LandListing landListing) {
        return LandListingDTO.builder()
                .id(landListing.getId())
                .sellerId(landListing.getSeller() != null ? landListing.getSeller().getId() : null)
                .sellerName(landListing.getSeller() != null && landListing.getSeller().getUser() != null ? 
                        landListing.getSeller().getUser().getFirstName() + " " + landListing.getSeller().getUser().getLastName() : null)
                .landTitle(landListing.getLandTitle())
                .description(landListing.getDescription())
                .areaInAcres(landListing.getAreaInAcres())
                .areaUnit(landListing.getAreaUnit())
                .village(landListing.getVillage())
                .electricityAvailability(landListing.getElectricityAvailability())
                .roadConnectivity(landListing.getRoadConnectivity())
                .documentUrl(landListing.getDocumentUrl())
                .landType(landListing.getLandType())
                .state(landListing.getState())
                .district(landListing.getDistrict())
                .taluka(landListing.getTaluka())
                .pinCode(landListing.getPinCode())
                .latitude(landListing.getLatitude() != null ? landListing.getLatitude().doubleValue() : null)
                .longitude(landListing.getLongitude() != null ? landListing.getLongitude().doubleValue() : null)
                .pricePerAcre(landListing.getPricePerAcre())
                .currency(landListing.getCurrency())
                .soilInformation(landListing.getSoilInformation())
                .waterSourceInformation(landListing.getWaterSourceInformation())
                .accessibility(landListing.getAccessibility())
                .landStatus(landListing.getLandStatus().name())
                .viewCount(landListing.getViewCount())
                .interestCount(landListing.getInterestCount())
                .images(landListing.getImages() != null ? landListing.getImages().stream().map(img -> LandImageDTO.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .publicId(img.getPublicId())
                        .isPrimary(img.getIsPrimary())
                        .displayOrder(img.getDisplayOrder())
                        .build()).toList() : new ArrayList<>())
                .createdAt(landListing.getCreatedAt())
                .updatedAt(landListing.getUpdatedAt())
                .build();
    }
}
