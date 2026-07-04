package com.smartkrishi.service.crop;

import com.smartkrishi.dto.crop.CropDTO;
import com.smartkrishi.entity.Category;
import com.smartkrishi.entity.Crop;
import com.smartkrishi.entity.Product;
import com.smartkrishi.entity.ProductImage;
import com.smartkrishi.entity.ProductInventory;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.CategoryRepository;
import com.smartkrishi.repository.CropRepository;
import com.smartkrishi.repository.ProductInventoryRepository;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.repository.SellerProfileRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Slf4j
public class CropServiceImpl implements CropService {

    private final CropRepository cropRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductInventoryRepository productInventoryRepository;

    @Override
    @Transactional
    public CropDTO createCrop(CropDTO cropDTO) {
        log.info("Creating crop marketplace listing: {}", cropDTO.getCropName());

        // 1. Resolve Crops Category
        Category category = categoryRepository.findByCategoryName("Crops")
                .orElseGet(() -> {
                    Category cat = new Category();
                    cat.setCategoryName("Crops");
                    cat.setDescription("Crops Category");
                    cat.setIsActive(true);
                    return categoryRepository.save(cat);
                });

        // 2. Resolve Authenticated SellerProfile & Verify Status
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated to list a crop");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found for user ID: " + principal.getId()));

        if (seller.getSellerStatus() != SellerProfile.SellerStatus.APPROVED) {
            throw new com.smartkrishi.exception.BadRequestException("Cannot create crop listing. Seller status is not APPROVED: " + seller.getSellerStatus());
        }

        // 3. Create Product
        Product product = new Product();
        product.setCategory(category);
        product.setSeller(seller);
        product.setProductName(cropDTO.getCropName() != null ? cropDTO.getCropName() : cropDTO.getProductName());
        product.setPrice(cropDTO.getPrice() != null ? cropDTO.getPrice() : java.math.BigDecimal.ZERO);
        product.setProductDescription(cropDTO.getDescription());
        product.setShortDescription(cropDTO.getDescription() != null && cropDTO.getDescription().length() > 200 
                ? cropDTO.getDescription().substring(0, 197) + "..." 
                : cropDTO.getDescription());
        
        Product.ProductStatus status = Product.ProductStatus.ACTIVE;
        if (cropDTO.getProductStatus() != null) {
            try {
                status = Product.ProductStatus.valueOf(cropDTO.getProductStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // fallback to ACTIVE
            }
        }
        product.setProductStatus(status);
        product.setSku(cropDTO.getSku() != null && !cropDTO.getSku().isEmpty() 
                ? cropDTO.getSku() 
                : "CRP-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
        
        Product savedProduct = productRepository.save(product);

        // 4. Save ProductInventory
        ProductInventory inventory = new ProductInventory();
        inventory.setProduct(savedProduct);
        inventory.setQuantityAvailable(cropDTO.getQuantity() != null ? cropDTO.getQuantity() : 0);
        inventory.setQuantityReserved(0);
        inventory.setQuantitySold(0);
        inventory.setReorderLevel(10);
        productInventoryRepository.save(inventory);
        savedProduct.setInventory(inventory);

        // 5. Save ProductImages
        if (cropDTO.getImages() != null && !cropDTO.getImages().isEmpty()) {
            java.util.Set<ProductImage> imageSet = new java.util.HashSet<>();
            int order = 0;
            for (com.smartkrishi.dto.product.ProductImageDTO imgDto : cropDTO.getImages()) {
                ProductImage img = new ProductImage();
                img.setProduct(savedProduct);
                img.setImageUrl(imgDto.getImageUrl());
                img.setPublicId(imgDto.getPublicId());
                img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : (order == 0));
                img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : order++);
                imageSet.add(img);
            }
            savedProduct.setImages(imageSet);
            productRepository.save(savedProduct);
        } else if (cropDTO.getImageUrls() != null && !cropDTO.getImageUrls().isEmpty()) {
            java.util.Set<ProductImage> imageSet = new java.util.HashSet<>();
            int order = 0;
            for (String url : cropDTO.getImageUrls()) {
                ProductImage img = new ProductImage();
                img.setProduct(savedProduct);
                img.setImageUrl(url);
                img.setIsPrimary(order == 0);
                img.setDisplayOrder(order++);
                imageSet.add(img);
            }
            savedProduct.setImages(imageSet);
            productRepository.save(savedProduct);
        }

        // 6. Create Crop
        Crop crop = new Crop();
        crop.setProduct(savedProduct);
        crop.setCropName(cropDTO.getCropName() != null ? cropDTO.getCropName() : cropDTO.getProductName());
        crop.setScientificName(cropDTO.getScientificName());
        crop.setCropType(cropDTO.getCropType() != null ? cropDTO.getCropType() : "Cereal");
        crop.setGrowingSeason(cropDTO.getGrowingSeason() != null ? cropDTO.getGrowingSeason() : "General");
        crop.setGrowthCycleDays(cropDTO.getGrowthCycleDays());
        crop.setSoilType(cropDTO.getSoilType());
        crop.setWaterRequirement(cropDTO.getWaterRequirement());
        crop.setTemperatureMin(cropDTO.getTemperatureMin());
        crop.setTemperatureMax(cropDTO.getTemperatureMax());
        crop.setYieldPerHectare(cropDTO.getYieldPerHectare());
        crop.setMarketDemand(cropDTO.getMarketDemand());
        crop.setVariety(cropDTO.getVariety());
        crop.setUnit(cropDTO.getUnit());
        crop.setHarvestDate(cropDTO.getHarvestDate());
        crop.setLocation(cropDTO.getLocation());

        Crop savedCrop = cropRepository.save(crop);
        return mapToDTO(savedCrop);
    }

    @Override
    @Transactional(readOnly = true)
    public CropDTO getCropById(Long id) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop", "id", id));
        return mapToDTO(crop);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CropDTO> getAllCrops(Pageable pageable) {
        return cropRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CropDTO> getCropsByType(String cropType, Pageable pageable) {
        return cropRepository.findByCropTypeContainingIgnoreCase(cropType, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CropDTO> getCropsBySeason(String season, Pageable pageable) {
        return cropRepository.findByGrowingSeasonContainingIgnoreCase(season, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional
    public CropDTO updateCrop(Long id, CropDTO cropDTO) {
        log.info("Updating crop marketplace listing with ID: {}", id);
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (crop.getProduct() == null || crop.getProduct().getSeller() == null || !crop.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        crop.setCropName(cropDTO.getCropName());
        crop.setScientificName(cropDTO.getScientificName());
        crop.setCropType(cropDTO.getCropType());
        crop.setGrowingSeason(cropDTO.getGrowingSeason());
        crop.setGrowthCycleDays(cropDTO.getGrowthCycleDays());
        crop.setSoilType(cropDTO.getSoilType());
        crop.setWaterRequirement(cropDTO.getWaterRequirement());
        crop.setTemperatureMin(cropDTO.getTemperatureMin());
        crop.setTemperatureMax(cropDTO.getTemperatureMax());
        crop.setYieldPerHectare(cropDTO.getYieldPerHectare());
        crop.setMarketDemand(cropDTO.getMarketDemand());
        crop.setVariety(cropDTO.getVariety());
        crop.setUnit(cropDTO.getUnit());
        crop.setHarvestDate(cropDTO.getHarvestDate());
        crop.setLocation(cropDTO.getLocation());

        // Update parent Product
        Product product = crop.getProduct();
        if (product != null) {
            product.setProductName(cropDTO.getCropName());
            product.setPrice(cropDTO.getPrice() != null ? cropDTO.getPrice() : java.math.BigDecimal.ZERO);
            product.setProductDescription(cropDTO.getDescription());
            product.setShortDescription(cropDTO.getDescription() != null && cropDTO.getDescription().length() > 200 
                    ? cropDTO.getDescription().substring(0, 197) + "..." 
                    : cropDTO.getDescription());

            if (cropDTO.getProductStatus() != null) {
                try {
                    product.setProductStatus(Product.ProductStatus.valueOf(cropDTO.getProductStatus().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // ignore
                }
            }

            // Update quantity
            ProductInventory inventory = product.getInventory();
            if (inventory == null) {
                inventory = new ProductInventory();
                inventory.setProduct(product);
                inventory.setQuantityReserved(0);
                inventory.setQuantitySold(0);
                inventory.setReorderLevel(10);
            }
            inventory.setQuantityAvailable(cropDTO.getQuantity() != null ? cropDTO.getQuantity() : 0);
            productInventoryRepository.save(inventory);
            product.setInventory(inventory);

            // Update images (overwrite/replace)
            if (cropDTO.getImages() != null) {
                product.getImages().clear();
                int order = 0;
                for (com.smartkrishi.dto.product.ProductImageDTO imgDto : cropDTO.getImages()) {
                    ProductImage img = new ProductImage();
                    img.setProduct(product);
                    img.setImageUrl(imgDto.getImageUrl());
                    img.setPublicId(imgDto.getPublicId());
                    img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : (order == 0));
                    img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : order++);
                    product.getImages().add(img);
                }
            } else if (cropDTO.getImageUrls() != null) {
                product.getImages().clear();
                int order = 0;
                for (String url : cropDTO.getImageUrls()) {
                    ProductImage img = new ProductImage();
                    img.setProduct(product);
                    img.setImageUrl(url);
                    img.setIsPrimary(order == 0);
                    img.setDisplayOrder(order++);
                    product.getImages().add(img);
                }
            }
            productRepository.save(product);
        }

        Crop updated = cropRepository.save(crop);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteCrop(Long id) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (crop.getProduct() == null || crop.getProduct().getSeller() == null || !crop.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        Product product = crop.getProduct();
        cropRepository.delete(crop);
        if (product != null) {
            productRepository.delete(product);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CropDTO> getCropsFiltered(String keyword, String state, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, Pageable pageable) {
        return cropRepository.filterCrops(keyword, state, minPrice, maxPrice, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public CropDTO getCropByProductId(Long productId) {
        Crop crop = cropRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop", "productId", productId));
        return mapToDTO(crop);
    }

    private CropDTO mapToDTO(Crop crop) {
        Product p = crop.getProduct();
        java.util.List<String> imageUrlsList = new java.util.ArrayList<>();
        java.util.List<com.smartkrishi.dto.product.ProductImageDTO> imagesList = new java.util.ArrayList<>();
        java.math.BigDecimal price = java.math.BigDecimal.ZERO;
        String sku = null;
        String desc = null;
        Integer qty = 0;
        Long sellerId = null;
        String sellerName = null;
        String productStatus = null;

        if (p != null) {
            price = p.getPrice();
            sku = p.getSku();
            desc = p.getProductDescription();
            productStatus = p.getProductStatus() != null ? p.getProductStatus().name() : null;
            if (p.getInventory() != null) {
                qty = p.getInventory().getQuantityAvailable();
            }
            if (p.getImages() != null && !p.getImages().isEmpty()) {
                imageUrlsList = p.getImages().stream()
                        .sorted(java.util.Comparator.comparing(ProductImage::getDisplayOrder))
                        .map(ProductImage::getImageUrl)
                        .collect(java.util.stream.Collectors.toList());
                imagesList = p.getImages().stream()
                        .sorted(java.util.Comparator.comparing(ProductImage::getDisplayOrder))
                        .map(img -> com.smartkrishi.dto.product.ProductImageDTO.builder()
                                .id(img.getId())
                                .imageUrl(img.getImageUrl())
                                .publicId(img.getPublicId())
                                .isPrimary(img.getIsPrimary())
                                .displayOrder(img.getDisplayOrder())
                                .build())
                        .collect(java.util.stream.Collectors.toList());
            }
            if (p.getSeller() != null) {
                sellerId = p.getSeller().getId();
                sellerName = p.getSeller().getBusinessName();
            }
        }

        return CropDTO.builder()
                .id(crop.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getProductName() : crop.getCropName())
                .cropName(crop.getCropName())
                .price(price)
                .sku(sku)
                .description(desc)
                .quantity(qty)
                .imageUrls(imageUrlsList)
                .images(imagesList)
                .sellerId(sellerId)
                .sellerBusinessName(sellerName)
                .scientificName(crop.getScientificName())
                .cropType(crop.getCropType())
                .growingSeason(crop.getGrowingSeason())
                .growthCycleDays(crop.getGrowthCycleDays())
                .soilType(crop.getSoilType())
                .waterRequirement(crop.getWaterRequirement())
                .temperatureMin(crop.getTemperatureMin())
                .temperatureMax(crop.getTemperatureMax())
                .yieldPerHectare(crop.getYieldPerHectare())
                .marketDemand(crop.getMarketDemand())
                .variety(crop.getVariety())
                .unit(crop.getUnit())
                .harvestDate(crop.getHarvestDate())
                .location(crop.getLocation())
                .productStatus(productStatus)
                .createdAt(crop.getCreatedAt())
                .build();
    }
}
