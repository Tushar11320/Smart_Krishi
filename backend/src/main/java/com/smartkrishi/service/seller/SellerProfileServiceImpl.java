package com.smartkrishi.service.seller;

import com.smartkrishi.dto.seller.SellerDashboardStatsDTO;
import com.smartkrishi.dto.seller.SellerProfileDTO;
import com.smartkrishi.entity.Order;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.entity.User;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.entity.Role;
import com.smartkrishi.repository.OrderRepository;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.repository.RoleRepository;
import com.smartkrishi.repository.SellerProfileRepository;
import com.smartkrishi.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class SellerProfileServiceImpl implements SellerProfileService {

    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public SellerProfileDTO createSellerProfile(SellerProfileDTO sellerProfileDTO) {
        if (sellerProfileDTO.getUserId() == null) {
            throw new BadRequestException("User ID is required to create a seller profile");
        }

        User user = userRepository.findById(sellerProfileDTO.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", sellerProfileDTO.getUserId()));

        // Check if seller profile already exists for this user
        if (sellerProfileRepository.findByUserId(user.getId()).isPresent()) {
            throw new BadRequestException("Seller profile already exists for user: " + user.getEmail());
        }

        SellerProfile sellerProfile = new SellerProfile();
        sellerProfile.setUser(user);
        sellerProfile.setBusinessName(sellerProfileDTO.getBusinessName());
        sellerProfile.setBusinessCategory(sellerProfileDTO.getBusinessCategory() != null ? sellerProfileDTO.getBusinessCategory() : "General");
        sellerProfile.setBusinessWebsite(sellerProfileDTO.getBusinessWebsite());
        sellerProfile.setLogoUrl(sellerProfileDTO.getLogoUrl());
        sellerProfile.setSellerStatus(SellerProfile.SellerStatus.PENDING);
        sellerProfile.setTotalProducts(0);
        sellerProfile.setTotalSales(BigDecimal.ZERO);
        sellerProfile.setRating(BigDecimal.ZERO);
        sellerProfile.setReviewCount(0);
        sellerProfile.setResponseTimeHours(0);
        sellerProfile.setReturnRate(BigDecimal.ZERO);
        sellerProfile.setCancellationRate(BigDecimal.ZERO);

        log.info("Creating seller profile for user: {}", user.getEmail());

        SellerProfile saved = sellerProfileRepository.save(sellerProfile);
        return mapToDTO(saved);
    }

    @Override
    public SellerProfileDTO getSellerProfileById(Long id) {
        SellerProfile sellerProfile = sellerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "id", id));
        return mapToDTO(sellerProfile);
    }

    @Override
    public SellerProfileDTO getSellerProfileByUserId(Long userId) {
        SellerProfile sellerProfile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "userId", userId));
        return mapToDTO(sellerProfile);
    }

    @Override
    public Page<SellerProfileDTO> getAllSellerProfiles(Pageable pageable) {
        return sellerProfileRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Override
    public Page<SellerProfileDTO> getVerifiedSellers(Pageable pageable) {
        return sellerProfileRepository.findByIsVerifiedTrue(pageable).map(this::mapToDTO);
    }

    @Override
    public Page<SellerProfileDTO> getTopRatedSellers(Pageable pageable) {
        return sellerProfileRepository.findTopRatedSellers(pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public SellerProfileDTO updateSellerProfile(Long id, SellerProfileDTO sellerProfileDTO) {
        SellerProfile sellerProfile = sellerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "id", id));

        if (sellerProfileDTO.getBusinessName() != null) {
            sellerProfile.setBusinessName(sellerProfileDTO.getBusinessName());
        }
        if (sellerProfileDTO.getBusinessCategory() != null) {
            sellerProfile.setBusinessCategory(sellerProfileDTO.getBusinessCategory());
        }
        if (sellerProfileDTO.getBusinessWebsite() != null) {
            sellerProfile.setBusinessWebsite(sellerProfileDTO.getBusinessWebsite());
        }
        if (sellerProfileDTO.getLogoUrl() != null) {
            sellerProfile.setLogoUrl(sellerProfileDTO.getLogoUrl());
        }
        if (sellerProfileDTO.getBio() != null) {
            sellerProfile.setBusinessDescription(sellerProfileDTO.getBio());
        }
        if (sellerProfileDTO.getBusinessType() != null) {
            sellerProfile.setBusinessType(sellerProfileDTO.getBusinessType());
        }
        if (sellerProfileDTO.getGstNumber() != null) {
            sellerProfile.setGstNumber(sellerProfileDTO.getGstNumber());
        }
        if (sellerProfileDTO.getPanNumber() != null) {
            sellerProfile.setPanNumber(sellerProfileDTO.getPanNumber());
        }
        if (sellerProfileDTO.getBusinessRegistrationNumber() != null) {
            sellerProfile.setBusinessRegistrationNumber(sellerProfileDTO.getBusinessRegistrationNumber());
        }
        if (sellerProfileDTO.getShopAddress() != null) {
            sellerProfile.setShopAddress(sellerProfileDTO.getShopAddress());
        }
        if (sellerProfileDTO.getState() != null) {
            sellerProfile.setState(sellerProfileDTO.getState());
        }
        if (sellerProfileDTO.getDistrict() != null) {
            sellerProfile.setDistrict(sellerProfileDTO.getDistrict());
        }
        if (sellerProfileDTO.getPincode() != null) {
            sellerProfile.setPincode(sellerProfileDTO.getPincode());
        }
        if (sellerProfileDTO.getBankAccountHolderName() != null) {
            sellerProfile.setBankAccountHolderName(sellerProfileDTO.getBankAccountHolderName());
        }
        if (sellerProfileDTO.getBankName() != null) {
            sellerProfile.setBankName(sellerProfileDTO.getBankName());
        }
        if (sellerProfileDTO.getAccountNumber() != null) {
            sellerProfile.setAccountNumber(sellerProfileDTO.getAccountNumber());
        }
        if (sellerProfileDTO.getIfscCode() != null) {
            sellerProfile.setIfscCode(sellerProfileDTO.getIfscCode());
        }
        if (sellerProfileDTO.getUpiId() != null) {
            sellerProfile.setUpiId(sellerProfileDTO.getUpiId());
        }
        if (sellerProfileDTO.getAadhaarDocumentUrl() != null) {
            sellerProfile.setAadhaarDocumentUrl(sellerProfileDTO.getAadhaarDocumentUrl());
        }
        if (sellerProfileDTO.getBusinessCertificateUrl() != null) {
            sellerProfile.setBusinessCertificateUrl(sellerProfileDTO.getBusinessCertificateUrl());
        }
        if (sellerProfileDTO.getProfileImage() != null && sellerProfile.getUser() != null) {
            sellerProfile.getUser().setProfileImage(sellerProfileDTO.getProfileImage());
            userRepository.save(sellerProfile.getUser());
        }

        log.info("Updated seller profile: {}", id);

        SellerProfile updated = sellerProfileRepository.save(sellerProfile);
        return mapToDTO(updated);
    }

    @Override
    public SellerDashboardStatsDTO getDashboardStats(Long sellerId) {
        if (!sellerProfileRepository.existsById(sellerId)) {
            throw new ResourceNotFoundException("SellerProfile", "id", sellerId);
        }

        Long totalProducts = productRepository.countBySellerIdAndDeletedAtIsNull(sellerId);
        Long totalOrders = orderRepository.countBySellerId(sellerId);
        java.math.BigDecimal totalRevenue = orderRepository.sumTotalAmountBySellerIdAndOrderStatusDelivered(sellerId);
        if (totalRevenue == null) {
            totalRevenue = java.math.BigDecimal.ZERO;
        }

        Long pendingOrdersCount = orderRepository.countBySellerIdAndOrderStatus(sellerId, Order.OrderStatus.PENDING);
        Long completedOrdersCount = orderRepository.countBySellerIdAndOrderStatus(sellerId, Order.OrderStatus.DELIVERED);

        // Fetch monthly sales for current year
        int currentYear = java.time.LocalDate.now().getYear();
        List<Object[]> monthlySalesData = orderRepository.getMonthlySalesBySellerIdAndYear(sellerId, currentYear);
        
        // Map to MonthlySalesDTO
        java.util.Map<Integer, java.math.BigDecimal> salesMap = new java.util.HashMap<>();
        for (Object[] row : monthlySalesData) {
            Integer monthVal = (Integer) row[0];
            java.math.BigDecimal salesSum = (java.math.BigDecimal) row[1];
            salesMap.put(monthVal, salesSum != null ? salesSum : java.math.BigDecimal.ZERO);
        }

        String[] monthNames = {"", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"};
        java.util.List<SellerDashboardStatsDTO.MonthlySalesDTO> monthlySales = new java.util.ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            java.math.BigDecimal sales = salesMap.getOrDefault(m, java.math.BigDecimal.ZERO);
            monthlySales.add(SellerDashboardStatsDTO.MonthlySalesDTO.builder()
                    .month(monthNames[m])
                    .monthValue(m)
                    .sales(sales)
                    .build());
        }

        return SellerDashboardStatsDTO.builder()
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .pendingOrdersCount(pendingOrdersCount)
                .completedOrdersCount(completedOrdersCount)
                .monthlySales(monthlySales)
                .build();
    }

    @Override
    @Transactional
    public SellerProfileDTO approveSellerProfile(Long id) {
        SellerProfile sellerProfile = sellerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "id", id));
        sellerProfile.setSellerStatus(SellerProfile.SellerStatus.APPROVED);
        sellerProfile.setVerifiedAt(LocalDateTime.now());
        sellerProfile.setRejectionReason(null);
        
        // Add SELLER role to user
        User user = sellerProfile.getUser();
        if (user != null) {
            Role sellerRole = roleRepository.findByRoleType(Role.RoleType.ROLE_SELLER)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "roleType", Role.RoleType.ROLE_SELLER.name()));
            user.getRoles().add(sellerRole);
            userRepository.save(user);
            log.info("Assigned SELLER role to user: {}", user.getEmail());
        }

        SellerProfile updated = sellerProfileRepository.save(sellerProfile);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public SellerProfileDTO rejectSellerProfile(Long id, String reason) {
        SellerProfile sellerProfile = sellerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "id", id));
        sellerProfile.setSellerStatus(SellerProfile.SellerStatus.REJECTED);
        sellerProfile.setRejectionReason(reason);
        sellerProfile.setVerifiedAt(null);
        SellerProfile updated = sellerProfileRepository.save(sellerProfile);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public SellerProfileDTO submitOnboarding(Long userId, SellerProfileDTO dto) {
        SellerProfile sellerProfile = sellerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    SellerProfile newProfile = new SellerProfile();
                    newProfile.setUser(user);
                    newProfile.setSellerStatus(SellerProfile.SellerStatus.PENDING);
                    newProfile.setTotalProducts(0);
                    newProfile.setTotalSales(BigDecimal.ZERO);
                    newProfile.setRating(BigDecimal.ZERO);
                    newProfile.setReviewCount(0);
                    newProfile.setResponseTimeHours(0);
                    newProfile.setReturnRate(BigDecimal.ZERO);
                    newProfile.setCancellationRate(BigDecimal.ZERO);
                    return newProfile;
                });

        sellerProfile.setBusinessName(dto.getBusinessName());
        sellerProfile.setBusinessType(dto.getBusinessType());
        sellerProfile.setGstNumber(dto.getGstNumber());
        sellerProfile.setPanNumber(dto.getPanNumber());
        sellerProfile.setBusinessRegistrationNumber(dto.getBusinessRegistrationNumber());
        sellerProfile.setShopAddress(dto.getShopAddress());
        sellerProfile.setState(dto.getState());
        sellerProfile.setDistrict(dto.getDistrict());
        sellerProfile.setPincode(dto.getPincode());
        sellerProfile.setBankAccountHolderName(dto.getBankAccountHolderName());
        sellerProfile.setBankName(dto.getBankName());
        sellerProfile.setAccountNumber(dto.getAccountNumber());
        sellerProfile.setIfscCode(dto.getIfscCode());
        sellerProfile.setUpiId(dto.getUpiId());
        sellerProfile.setAadhaarDocumentUrl(dto.getAadhaarDocumentUrl());
        sellerProfile.setBusinessCertificateUrl(dto.getBusinessCertificateUrl());
        
        if (dto.getLogoUrl() != null) {
            sellerProfile.setLogoUrl(dto.getLogoUrl());
        }

        // Reset status to PENDING on submission/resubmission
        sellerProfile.setSellerStatus(SellerProfile.SellerStatus.PENDING);
        sellerProfile.setRejectionReason(null);

        // Update profile photo in the User entity if provided
        if (dto.getProfileImage() != null && sellerProfile.getUser() != null) {
            sellerProfile.getUser().setProfileImage(dto.getProfileImage());
            userRepository.save(sellerProfile.getUser());
        }

        SellerProfile saved = sellerProfileRepository.save(sellerProfile);
        log.info("Onboarding submitted successfully for seller: {}", saved.getBusinessName());
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public SellerProfileDTO suspendSellerProfile(Long id, String reason) {
        SellerProfile sellerProfile = sellerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "id", id));
        sellerProfile.setSellerStatus(SellerProfile.SellerStatus.SUSPENDED);
        sellerProfile.setRejectionReason(reason);
        SellerProfile updated = sellerProfileRepository.save(sellerProfile);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteSellerProfile(Long id) {
        if (!sellerProfileRepository.existsById(id)) {
            throw new ResourceNotFoundException("SellerProfile", "id", id);
        }
        sellerProfileRepository.deleteById(id);
    }

    private SellerProfileDTO mapToDTO(SellerProfile sellerProfile) {
        return SellerProfileDTO.builder()
                .id(sellerProfile.getId())
                .userId(sellerProfile.getUser() != null ? sellerProfile.getUser().getId() : null)
                .firstName(sellerProfile.getUser() != null ? sellerProfile.getUser().getFirstName() : null)
                .lastName(sellerProfile.getUser() != null ? sellerProfile.getUser().getLastName() : null)
                .email(sellerProfile.getUser() != null ? sellerProfile.getUser().getEmail() : null)
                .phone(sellerProfile.getUser() != null ? sellerProfile.getUser().getPhone() : null)
                .businessName(sellerProfile.getBusinessName())
                .businessCategory(sellerProfile.getBusinessCategory())
                .businessWebsite(sellerProfile.getBusinessWebsite())
                .logoUrl(sellerProfile.getLogoUrl())
                .sellerStatus(sellerProfile.getSellerStatus() != null ? sellerProfile.getSellerStatus().name() : null)
                .businessType(sellerProfile.getBusinessType())
                .gstNumber(sellerProfile.getGstNumber())
                .panNumber(sellerProfile.getPanNumber())
                .businessRegistrationNumber(sellerProfile.getBusinessRegistrationNumber())
                .shopAddress(sellerProfile.getShopAddress())
                .state(sellerProfile.getState())
                .district(sellerProfile.getDistrict())
                .pincode(sellerProfile.getPincode())
                .bankAccountHolderName(sellerProfile.getBankAccountHolderName())
                .bankName(sellerProfile.getBankName())
                .accountNumber(sellerProfile.getAccountNumber())
                .ifscCode(sellerProfile.getIfscCode())
                .upiId(sellerProfile.getUpiId())
                .aadhaarDocumentUrl(sellerProfile.getAadhaarDocumentUrl())
                .businessCertificateUrl(sellerProfile.getBusinessCertificateUrl())
                .rejectionReason(sellerProfile.getRejectionReason())
                .profileImage(sellerProfile.getUser() != null ? sellerProfile.getUser().getProfileImage() : null)
                .totalProducts(sellerProfile.getTotalProducts() != null ? sellerProfile.getTotalProducts().longValue() : 0L)
                .totalSales(sellerProfile.getTotalSales() != null ? sellerProfile.getTotalSales().longValue() : 0L)
                .rating(sellerProfile.getRating() != null ? sellerProfile.getRating().doubleValue() : 0.0)
                .reviewCount(sellerProfile.getReviewCount() != null ? sellerProfile.getReviewCount().longValue() : 0L)
                .returnRate(sellerProfile.getReturnRate() != null ? sellerProfile.getReturnRate().doubleValue() : 0.0)
                .cancellationRate(sellerProfile.getCancellationRate() != null ? sellerProfile.getCancellationRate().doubleValue() : 0.0)
                .createdAt(sellerProfile.getCreatedAt())
                .updatedAt(sellerProfile.getUpdatedAt())
                .build();
    }
}

