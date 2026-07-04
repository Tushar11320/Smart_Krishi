package com.smartkrishi.service.fertilizer;

import com.smartkrishi.dto.fertilizer.FertilizerDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Slf4j
public class FertilizerServiceImpl implements FertilizerService {

    private final FertilizerRepository fertilizerRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductInventoryRepository productInventoryRepository;

    @Override
    @Transactional
    public FertilizerDTO createFertilizer(FertilizerDTO fertilizerDTO) {
        log.info("Creating fertilizer listing: {}", fertilizerDTO.getProductName());

        // 1. Resolve Fertilizers Category
        Category category = categoryRepository.findByCategoryName("Fertilizers")
                .orElseGet(() -> {
                    Category cat = new Category();
                    cat.setCategoryName("Fertilizers");
                    cat.setDescription("Fertilizers Category");
                    cat.setIsActive(true);
                    return categoryRepository.save(cat);
                });

        // 2. Resolve Authenticated SellerProfile & Verify Status
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated to list a fertilizer");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found for user ID: " + principal.getId()));

        if (seller.getSellerStatus() != SellerProfile.SellerStatus.APPROVED) {
            throw new com.smartkrishi.exception.BadRequestException("Cannot create fertilizer listing. Seller status is not APPROVED: " + seller.getSellerStatus());
        }

        // 3. Create Product
        Product product = new Product();
        product.setCategory(category);
        product.setSeller(seller);
        product.setProductName(fertilizerDTO.getProductName());
        product.setPrice(fertilizerDTO.getPrice() != null ? fertilizerDTO.getPrice() : java.math.BigDecimal.ZERO);
        product.setProductDescription(fertilizerDTO.getDescription());
        product.setShortDescription(fertilizerDTO.getDescription() != null && fertilizerDTO.getDescription().length() > 200 
                ? fertilizerDTO.getDescription().substring(0, 197) + "..." 
                : fertilizerDTO.getDescription());
        
        Product.ProductStatus status = Product.ProductStatus.ACTIVE;
        if (fertilizerDTO.getProductStatus() != null) {
            try {
                status = Product.ProductStatus.valueOf(fertilizerDTO.getProductStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // fallback to ACTIVE
            }
        }
        product.setProductStatus(status);
        product.setSku(fertilizerDTO.getSku() != null && !fertilizerDTO.getSku().isEmpty() 
                ? fertilizerDTO.getSku() 
                : "FTZ-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
        
        Product savedProduct = productRepository.save(product);

        // 4. Save Inventory
        ProductInventory inventory = new ProductInventory();
        inventory.setProduct(savedProduct);
        inventory.setQuantityAvailable(fertilizerDTO.getQuantity() != null ? fertilizerDTO.getQuantity() : 0);
        inventory.setQuantityReserved(0);
        inventory.setQuantitySold(0);
        inventory.setReorderLevel(10);
        productInventoryRepository.save(inventory);
        savedProduct.setInventory(inventory);

        // 5. Save Images
        if (fertilizerDTO.getImages() != null && !fertilizerDTO.getImages().isEmpty()) {
            java.util.Set<ProductImage> imageSet = new java.util.HashSet<>();
            int order = 0;
            for (com.smartkrishi.dto.product.ProductImageDTO imgDto : fertilizerDTO.getImages()) {
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
        } else if (fertilizerDTO.getImageUrls() != null && !fertilizerDTO.getImageUrls().isEmpty()) {
            java.util.Set<ProductImage> imageSet = new java.util.HashSet<>();
            int order = 0;
            for (String url : fertilizerDTO.getImageUrls()) {
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

        // 6. Create Fertilizer
        Fertilizer fertilizer = new Fertilizer();
        fertilizer.setProduct(savedProduct);
        fertilizer.setFertilizerName(fertilizerDTO.getProductName());
        fertilizer.setBrand(fertilizerDTO.getBrand() != null ? fertilizerDTO.getBrand() : "General");
        fertilizer.setManufacturingDate(fertilizerDTO.getManufacturingDate());
        fertilizer.setExpiryDate(fertilizerDTO.getExpiryDate());

        Fertilizer savedFertilizer = fertilizerRepository.save(fertilizer);
        return mapToDTO(savedFertilizer);
    }

    @Override
    @Transactional(readOnly = true)
    public FertilizerDTO getFertilizerById(Long id) {
        Fertilizer fertilizer = fertilizerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fertilizer", "id", id));
        return mapToDTO(fertilizer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FertilizerDTO> getAllFertilizers(Pageable pageable) {
        return fertilizerRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public FertilizerDTO updateFertilizer(Long id, FertilizerDTO fertilizerDTO) {
        log.info("Updating fertilizer listing with ID: {}", id);
        Fertilizer fertilizer = fertilizerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fertilizer", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (fertilizer.getProduct() == null || fertilizer.getProduct().getSeller() == null || !fertilizer.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        fertilizer.setFertilizerName(fertilizerDTO.getProductName());
        fertilizer.setBrand(fertilizerDTO.getBrand());
        fertilizer.setManufacturingDate(fertilizerDTO.getManufacturingDate());
        fertilizer.setExpiryDate(fertilizerDTO.getExpiryDate());

        // Update Product
        Product product = fertilizer.getProduct();
        if (product != null) {
            product.setProductName(fertilizerDTO.getProductName());
            product.setPrice(fertilizerDTO.getPrice() != null ? fertilizerDTO.getPrice() : java.math.BigDecimal.ZERO);
            product.setProductDescription(fertilizerDTO.getDescription());
            product.setShortDescription(fertilizerDTO.getDescription() != null && fertilizerDTO.getDescription().length() > 200 
                    ? fertilizerDTO.getDescription().substring(0, 197) + "..." 
                    : fertilizerDTO.getDescription());

            if (fertilizerDTO.getProductStatus() != null) {
                try {
                    product.setProductStatus(Product.ProductStatus.valueOf(fertilizerDTO.getProductStatus().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // ignore
                }
            }

            // Update inventory
            ProductInventory inventory = product.getInventory();
            if (inventory == null) {
                inventory = new ProductInventory();
                inventory.setProduct(product);
                inventory.setQuantityReserved(0);
                inventory.setQuantitySold(0);
                inventory.setReorderLevel(10);
            }
            inventory.setQuantityAvailable(fertilizerDTO.getQuantity() != null ? fertilizerDTO.getQuantity() : 0);
            productInventoryRepository.save(inventory);
            product.setInventory(inventory);

            // Update images
            if (fertilizerDTO.getImages() != null) {
                product.getImages().clear();
                int order = 0;
                for (com.smartkrishi.dto.product.ProductImageDTO imgDto : fertilizerDTO.getImages()) {
                    ProductImage img = new ProductImage();
                    img.setProduct(product);
                    img.setImageUrl(imgDto.getImageUrl());
                    img.setPublicId(imgDto.getPublicId());
                    img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : (order == 0));
                    img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : order++);
                    product.getImages().add(img);
                }
            } else if (fertilizerDTO.getImageUrls() != null) {
                product.getImages().clear();
                int order = 0;
                for (String url : fertilizerDTO.getImageUrls()) {
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

        Fertilizer updated = fertilizerRepository.save(fertilizer);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteFertilizer(Long id) {
        Fertilizer fertilizer = fertilizerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fertilizer", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (fertilizer.getProduct() == null || fertilizer.getProduct().getSeller() == null || !fertilizer.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        Product product = fertilizer.getProduct();
        fertilizerRepository.delete(fertilizer);
        if (product != null) {
            productRepository.delete(product);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public FertilizerDTO getFertilizerByProductId(Long productId) {
        Fertilizer fertilizer = fertilizerRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Fertilizer", "productId", productId));
        return mapToDTO(fertilizer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FertilizerDTO> getFertilizersFiltered(String keyword, String brand, java.math.BigDecimal maxPrice, Pageable pageable) {
        return fertilizerRepository.filterFertilizers(keyword, brand, maxPrice, pageable)
                .map(this::mapToDTO);
    }

    private FertilizerDTO mapToDTO(Fertilizer fertilizer) {
        Product p = fertilizer.getProduct();
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

        return FertilizerDTO.builder()
                .id(fertilizer.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getProductName() : fertilizer.getFertilizerName())
                .sku(sku)
                .price(price)
                .description(desc)
                .quantity(qty)
                .imageUrls(imageUrlsList)
                .images(imagesList)
                .sellerId(sellerId)
                .sellerBusinessName(sellerName)
                .fertilizerName(fertilizer.getFertilizerName())
                .brand(fertilizer.getBrand())
                .manufacturingDate(fertilizer.getManufacturingDate())
                .expiryDate(fertilizer.getExpiryDate())
                .productStatus(productStatus)
                .createdAt(fertilizer.getCreatedAt())
                .build();
    }
}
