package com.smartkrishi.service.material;

import com.smartkrishi.dto.material.BuildingMaterialDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class BuildingMaterialServiceImpl implements BuildingMaterialService {

    private final BuildingMaterialRepository buildingMaterialRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductInventoryRepository productInventoryRepository;

    @Override
    @Transactional
    public BuildingMaterialDTO createMaterial(BuildingMaterialDTO dto) {
        log.info("Creating building material listing: {}", dto.getProductName());

        // 1. Resolve Category
        Category category = categoryRepository.findByCategoryName("Building Materials")
                .orElseGet(() -> {
                    Category cat = new Category();
                    cat.setCategoryName("Building Materials");
                    cat.setDescription("Agricultural and general construction building materials");
                    cat.setIsActive(true);
                    return categoryRepository.save(cat);
                });

        // 2. Resolve Authenticated SellerProfile & Verify Status
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated to list a building material");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found for user ID: " + principal.getId()));

        if (seller.getSellerStatus() != SellerProfile.SellerStatus.APPROVED) {
            throw new com.smartkrishi.exception.BadRequestException("Cannot create building material listing. Seller status is not APPROVED: " + seller.getSellerStatus());
        }

        // 3. Create Product
        Product product = new Product();
        product.setCategory(category);
        product.setSeller(seller);
        product.setProductName(dto.getProductName());
        product.setPrice(dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO);
        product.setProductDescription(dto.getDescription());
        product.setShortDescription(dto.getDescription() != null && dto.getDescription().length() > 200 
                ? dto.getDescription().substring(0, 197) + "..." 
                : dto.getDescription());
        
        Product.ProductStatus status = Product.ProductStatus.ACTIVE;
        if (dto.getProductStatus() != null) {
            try {
                status = Product.ProductStatus.valueOf(dto.getProductStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // fallback to ACTIVE
            }
        }
        product.setProductStatus(status);
        product.setSku(dto.getSku() != null && !dto.getSku().isEmpty() 
                ? dto.getSku() 
                : "MAT-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));

        Product savedProduct = productRepository.save(product);

        // 4. Save Inventory
        ProductInventory inventory = new ProductInventory();
        inventory.setProduct(savedProduct);
        inventory.setQuantityAvailable(dto.getQuantity() != null ? dto.getQuantity() : 1);
        inventory.setQuantityReserved(0);
        inventory.setQuantitySold(0);
        inventory.setReorderLevel(5);
        productInventoryRepository.save(inventory);
        savedProduct.setInventory(inventory);

        // 5. Save ProductImages
        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            Set<ProductImage> imageSet = new HashSet<>();
            int order = 0;
            for (com.smartkrishi.dto.product.ProductImageDTO imgDto : dto.getImages()) {
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
        } else if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            Set<ProductImage> imageSet = new HashSet<>();
            int order = 0;
            for (String url : dto.getImageUrls()) {
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

        // 6. Create BuildingMaterial
        BuildingMaterial material = new BuildingMaterial();
        material.setProduct(savedProduct);
        material.setMaterialType(dto.getMaterialType() != null ? dto.getMaterialType() : "Other");
        material.setUnit(dto.getUnit() != null ? dto.getUnit() : "pieces");
        material.setDeliveryAvailable(dto.getDeliveryAvailable() != null ? dto.getDeliveryAvailable() : false);

        BuildingMaterial saved = buildingMaterialRepository.save(material);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BuildingMaterialDTO getMaterialById(Long id) {
        BuildingMaterial material = buildingMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BuildingMaterial", "id", id));
        return mapToDTO(material);
    }

    @Override
    @Transactional(readOnly = true)
    public BuildingMaterialDTO getMaterialByProductId(Long productId) {
        BuildingMaterial material = buildingMaterialRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("BuildingMaterial", "productId", productId));
        return mapToDTO(material);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BuildingMaterialDTO> getAllMaterials(Pageable pageable) {
        return buildingMaterialRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public BuildingMaterialDTO updateMaterial(Long id, BuildingMaterialDTO dto) {
        log.info("Updating building material listing ID: {}", id);
        BuildingMaterial material = buildingMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BuildingMaterial", "id", id));

        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (material.getProduct() == null || material.getProduct().getSeller() == null || !material.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        material.setMaterialType(dto.getMaterialType());
        material.setUnit(dto.getUnit());
        material.setDeliveryAvailable(dto.getDeliveryAvailable() != null ? dto.getDeliveryAvailable() : false);

        // Update Product
        Product product = material.getProduct();
        if (product != null) {
            product.setProductName(dto.getProductName());
            product.setPrice(dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO);
            product.setProductDescription(dto.getDescription());
            product.setShortDescription(dto.getDescription() != null && dto.getDescription().length() > 200 
                    ? dto.getDescription().substring(0, 197) + "..." 
                    : dto.getDescription());

            if (dto.getProductStatus() != null) {
                try {
                    product.setProductStatus(Product.ProductStatus.valueOf(dto.getProductStatus().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // ignore
                }
            }

            // Inventory
            ProductInventory inventory = product.getInventory();
            if (inventory == null) {
                inventory = new ProductInventory();
                inventory.setProduct(product);
                inventory.setQuantityReserved(0);
                inventory.setQuantitySold(0);
                inventory.setReorderLevel(5);
            }
            inventory.setQuantityAvailable(dto.getQuantity() != null ? dto.getQuantity() : 1);
            productInventoryRepository.save(inventory);
            product.setInventory(inventory);

            // Images
            if (dto.getImages() != null) {
                product.getImages().clear();
                int order = 0;
                for (com.smartkrishi.dto.product.ProductImageDTO imgDto : dto.getImages()) {
                    ProductImage img = new ProductImage();
                    img.setProduct(product);
                    img.setImageUrl(imgDto.getImageUrl());
                    img.setPublicId(imgDto.getPublicId());
                    img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : (order == 0));
                    img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : order++);
                    product.getImages().add(img);
                }
            } else if (dto.getImageUrls() != null) {
                product.getImages().clear();
                int order = 0;
                for (String url : dto.getImageUrls()) {
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

        BuildingMaterial updated = buildingMaterialRepository.save(material);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteMaterial(Long id) {
        BuildingMaterial material = buildingMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BuildingMaterial", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (material.getProduct() == null || material.getProduct().getSeller() == null || !material.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        Product product = material.getProduct();
        buildingMaterialRepository.delete(material);
        if (product != null) {
            productRepository.delete(product);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BuildingMaterialDTO> getMaterialsFiltered(
            String keyword, String materialType, Boolean deliveryAvailable, BigDecimal maxPrice, Pageable pageable) {
        return buildingMaterialRepository.filterMaterials(keyword, materialType, deliveryAvailable, maxPrice, pageable)
                .map(this::mapToDTO);
    }

    private BuildingMaterialDTO mapToDTO(BuildingMaterial bm) {
        Product p = bm.getProduct();
        List<String> imageUrlsList = new ArrayList<>();
        List<com.smartkrishi.dto.product.ProductImageDTO> imagesList = new ArrayList<>();
        BigDecimal price = BigDecimal.ZERO;
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
                        .collect(Collectors.toList());
                imagesList = p.getImages().stream()
                        .sorted(java.util.Comparator.comparing(ProductImage::getDisplayOrder))
                        .map(img -> com.smartkrishi.dto.product.ProductImageDTO.builder()
                                .id(img.getId())
                                .imageUrl(img.getImageUrl())
                                .publicId(img.getPublicId())
                                .isPrimary(img.getIsPrimary())
                                .displayOrder(img.getDisplayOrder())
                                .build())
                        .collect(Collectors.toList());
            }
            if (p.getSeller() != null) {
                sellerId = p.getSeller().getId();
                sellerName = p.getSeller().getBusinessName();
            }
        }

        return BuildingMaterialDTO.builder()
                .id(bm.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getProductName() : null)
                .sku(sku)
                .price(price)
                .description(desc)
                .quantity(qty)
                .imageUrls(imageUrlsList)
                .images(imagesList)
                .sellerId(sellerId)
                .sellerBusinessName(sellerName)
                .materialType(bm.getMaterialType())
                .unit(bm.getUnit())
                .deliveryAvailable(bm.getDeliveryAvailable())
                .productStatus(productStatus)
                .createdAt(bm.getCreatedAt())
                .build();
    }
}
