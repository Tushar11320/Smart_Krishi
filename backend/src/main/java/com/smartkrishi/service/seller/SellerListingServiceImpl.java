package com.smartkrishi.service.seller;

import com.smartkrishi.dto.product.ProductDTO;
import com.smartkrishi.dto.product.ProductImageDTO;
import com.smartkrishi.dto.product.ProductInventoryDTO;
import com.smartkrishi.dto.land.LandListingDTO;
import com.smartkrishi.dto.land.LandImageDTO;
import com.smartkrishi.dto.seller.SellerInventoryStatsDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SellerListingServiceImpl implements SellerListingService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private LandListingRepository landListingRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public SellerInventoryStatsDTO getSellerInventoryStats(Long sellerUserId) {
        SellerProfile seller = sellerProfileRepository.findByUserId(sellerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found for user: " + sellerUserId));

        // Get all products of the seller
        List<Product> products = productRepository.findBySellerIdAndDeletedAtIsNull(seller.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();

        // Get all land listings of the seller
        List<LandListing> lands = landListingRepository.findBySellerId(seller.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();

        long activeProducts = products.stream().filter(p -> p.getProductStatus() == Product.ProductStatus.ACTIVE).count();
        long activeLands = lands.stream().filter(l -> l.getLandStatus() == LandListing.LandStatus.AVAILABLE).count();

        long inactiveProducts = products.stream().filter(p -> p.getProductStatus() == Product.ProductStatus.INACTIVE || p.getProductStatus() == Product.ProductStatus.DRAFT).count();
        long inactiveLands = lands.stream().filter(l -> l.getLandStatus() == LandListing.LandStatus.DELISTED).count();

        long lowStock = 0;
        long outOfStock = 0;

        for (Product p : products) {
            ProductInventory inv = p.getInventory();
            if (inv != null) {
                int availableQty = inv.getQuantityAvailable() - inv.getQuantityReserved();
                if (availableQty <= 0) {
                    outOfStock++;
                } else if (availableQty <= inv.getReorderLevel() && p.getProductStatus() == Product.ProductStatus.ACTIVE) {
                    lowStock++;
                }
            } else {
                // Products without inventory map as out of stock
                outOfStock++;
            }
        }

        return SellerInventoryStatsDTO.builder()
                .totalListings((long) (products.size() + lands.size()))
                .activeListings(activeProducts + activeLands)
                .inactiveListings(inactiveProducts + inactiveLands)
                .lowStockListings(lowStock)
                .outOfStockListings(outOfStock)
                .build();
    }

    @Override
    @Transactional
    public ProductDTO toggleProductStatus(Long productId, String status, Long sellerUserId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        validateProductOwnership(product, sellerUserId);

        Product.ProductStatus oldStatus = product.getProductStatus();
        Product.ProductStatus newStatus;
        try {
            newStatus = Product.ProductStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid product status: " + status);
        }

        product.setProductStatus(newStatus);
        Product savedProduct = productRepository.save(product);

        // Audit Logging
        logAction("PRODUCT", productId, "STATUS_CHANGE", sellerUserId,
                "status: " + oldStatus, "status: " + newStatus);

        return mapProductToDTO(savedProduct);
    }

    @Override
    @Transactional
    public ProductDTO updateProductStock(Long productId, Integer quantity, Integer reorderLevel, Long sellerUserId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        validateProductOwnership(product, sellerUserId);

        ProductInventory inv = product.getInventory();
        if (inv == null) {
            inv = new ProductInventory();
            inv.setProduct(product);
            inv.setQuantityReserved(0);
            inv.setQuantitySold(0);
        }

        int oldQty = inv.getQuantityAvailable();
        int oldReorder = inv.getReorderLevel();

        if (quantity != null) {
            inv.setQuantityAvailable(quantity);
        }
        if (reorderLevel != null) {
            inv.setReorderLevel(reorderLevel);
        }

        product.setInventory(inv);
        Product savedProduct = productRepository.save(product);

        // Audit Logging
        logAction("PRODUCT", productId, "STOCK_UPDATE", sellerUserId,
                "quantityAvailable: " + oldQty + ", reorderLevel: " + oldReorder,
                "quantityAvailable: " + inv.getQuantityAvailable() + ", reorderLevel: " + inv.getReorderLevel());

        return mapProductToDTO(savedProduct);
    }

    @Override
    @Transactional
    public void bulkUpdateStatus(List<Long> productIds, String status, Long sellerUserId) {
        Product.ProductStatus newStatus;
        try {
            newStatus = Product.ProductStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid product status: " + status);
        }

        for (Long id : productIds) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
            
            validateProductOwnership(product, sellerUserId);

            Product.ProductStatus oldStatus = product.getProductStatus();
            product.setProductStatus(newStatus);
            productRepository.save(product);

            logAction("PRODUCT", id, "BULK_STATUS_CHANGE", sellerUserId,
                    "status: " + oldStatus, "status: " + newStatus);
        }
    }

    @Override
    @Transactional
    public void bulkUpdateStock(List<Long> productIds, Integer quantity, Long sellerUserId) {
        for (Long id : productIds) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

            validateProductOwnership(product, sellerUserId);

            ProductInventory inv = product.getInventory();
            if (inv == null) {
                inv = new ProductInventory();
                inv.setProduct(product);
                inv.setQuantityReserved(0);
                inv.setQuantitySold(0);
            }

            int oldQty = inv.getQuantityAvailable();
            inv.setQuantityAvailable(quantity);
            product.setInventory(inv);
            productRepository.save(product);

            logAction("PRODUCT", id, "BULK_STOCK_UPDATE", sellerUserId,
                    "quantityAvailable: " + oldQty, "quantityAvailable: " + quantity);
        }
    }

    @Override
    @Transactional
    public LandListingDTO toggleLandStatus(Long landId, String status, Long sellerUserId) {
        LandListing land = landListingRepository.findById(landId)
                .orElseThrow(() -> new ResourceNotFoundException("LandListing not found with id: " + landId));

        validateLandOwnership(land, sellerUserId);

        LandListing.LandStatus oldStatus = land.getLandStatus();
        LandListing.LandStatus newStatus;
        try {
            newStatus = LandListing.LandStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid land status: " + status);
        }

        land.setLandStatus(newStatus);
        LandListing savedLand = landListingRepository.save(land);

        // Audit Logging
        logAction("LAND", landId, "STATUS_CHANGE", sellerUserId,
                "status: " + oldStatus, "status: " + newStatus);

        return mapLandToDTO(savedLand);
    }

    @Override
    @Transactional
    public void bulkUpdateLandStatus(List<Long> landIds, String status, Long sellerUserId) {
        LandListing.LandStatus newStatus;
        try {
            newStatus = LandListing.LandStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid land status: " + status);
        }

        for (Long id : landIds) {
            LandListing land = landListingRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("LandListing not found with id: " + id));

            validateLandOwnership(land, sellerUserId);

            LandListing.LandStatus oldStatus = land.getLandStatus();
            land.setLandStatus(newStatus);
            landListingRepository.save(land);

            logAction("LAND", id, "BULK_STATUS_CHANGE", sellerUserId,
                    "status: " + oldStatus, "status: " + newStatus);
        }
    }

    private void validateProductOwnership(Product product, Long sellerUserId) {
        if (product.getSeller() == null || product.getSeller().getUser() == null || 
                !product.getSeller().getUser().getId().equals(sellerUserId)) {
            log.warn("Access Denied: User {} attempted to edit product {} owned by seller {}", 
                    sellerUserId, product.getId(), product.getSeller() != null ? product.getSeller().getId() : "null");
            throw new AccessDeniedException("Unauthorized: You do not own this listing");
        }
    }

    private void validateLandOwnership(LandListing land, Long sellerUserId) {
        if (land.getSeller() == null || land.getSeller().getUser() == null || 
                !land.getSeller().getUser().getId().equals(sellerUserId)) {
            log.warn("Access Denied: User {} attempted to edit land listing {} owned by seller {}", 
                    sellerUserId, land.getId(), land.getSeller() != null ? land.getSeller().getId() : "null");
            throw new AccessDeniedException("Unauthorized: You do not own this listing");
        }
    }

    private void logAction(String entityType, Long entityId, String action, Long actorId, String oldValues, String newValues) {
        try {
            AuditLog logEntry = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .actorId(actorId)
                    .actorType(AuditLog.ActorType.USER)
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .changeReason("Seller dashboard update")
                    .build();
            auditLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to write general audit log", e);
        }
    }

    private ProductDTO mapProductToDTO(Product product) {
        ProductDTO dto = ProductDTO.builder()
                .id(product.getId())
                .productName(product.getProductName())
                .sku(product.getSku())
                .productDescription(product.getProductDescription())
                .shortDescription(product.getShortDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .discountPercentage(product.getDiscountPercentage())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getCategoryName())
                .subcategoryId(product.getSubcategory() != null ? product.getSubcategory().getId() : null)
                .subcategoryName(product.getSubcategory() != null ? product.getSubcategory().getSubcategoryName() : null)
                .sellerId(product.getSeller() != null ? product.getSeller().getId() : null)
                .sellerName(product.getSeller() != null ? product.getSeller().getBusinessName() : null)
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .purchaseCount(product.getPurchaseCount())
                .viewCount(product.getViewCount())
                .isFeatured(product.getIsFeatured())
                .isBestseller(product.getIsBestseller())
                .productStatus(product.getProductStatus().toString())
                .build();

        if (product.getImages() != null && !product.getImages().isEmpty()) {
            dto.setImages(product.getImages().stream().map(img -> ProductImageDTO.builder()
                    .id(img.getId())
                    .imageUrl(img.getImageUrl())
                    .publicId(img.getPublicId())
                    .isPrimary(img.getIsPrimary())
                    .displayOrder(img.getDisplayOrder())
                    .build()).collect(Collectors.toList()));
        }

        if (product.getInventory() != null) {
            dto.setInventory(ProductInventoryDTO.builder()
                    .id(product.getInventory().getId())
                    .quantityAvailable(product.getInventory().getQuantityAvailable())
                    .quantityReserved(product.getInventory().getQuantityReserved())
                    .quantitySold(product.getInventory().getQuantitySold())
                    .reorderLevel(product.getInventory().getReorderLevel())
                    .reorderQuantity(product.getInventory().getReorderQuantity())
                    .availableQuantity(product.getInventory().getAvailableQuantity())
                    .build());
        }

        return dto;
    }

    private LandListingDTO mapLandToDTO(LandListing landListing) {
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
