package com.smartkrishi.service.milk;

import com.smartkrishi.dto.milk.MilkDTO;
import com.smartkrishi.entity.Category;
import com.smartkrishi.entity.Milk;
import com.smartkrishi.entity.Product;
import com.smartkrishi.entity.ProductImage;
import com.smartkrishi.entity.ProductInventory;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.CategoryRepository;
import com.smartkrishi.repository.MilkRepository;
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
public class MilkServiceImpl implements MilkService {

    private final MilkRepository milkRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductInventoryRepository productInventoryRepository;

    @Override
    @Transactional
    public MilkDTO createMilk(MilkDTO milkDTO) {
        log.info("Creating milk marketplace listing: {}", milkDTO.getProductName());

        // 1. Resolve Dairy Products Category
        Category category = categoryRepository.findByCategoryName("Dairy Products")
                .orElseGet(() -> {
                    Category cat = new Category();
                    cat.setCategoryName("Dairy Products");
                    cat.setDescription("Dairy Products Category");
                    cat.setIsActive(true);
                    return categoryRepository.save(cat);
                });

        // 2. Resolve Authenticated SellerProfile & Verify Status
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated to list a dairy product");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found for user ID: " + principal.getId()));

        if (seller.getSellerStatus() != SellerProfile.SellerStatus.APPROVED) {
            throw new com.smartkrishi.exception.BadRequestException("Cannot create dairy product listing. Seller status is not APPROVED: " + seller.getSellerStatus());
        }

        // 3. Create Product
        Product product = new Product();
        product.setCategory(category);
        product.setSeller(seller);
        product.setProductName(milkDTO.getProductName());
        product.setPrice(milkDTO.getPrice() != null ? milkDTO.getPrice() : java.math.BigDecimal.ZERO);
        product.setProductDescription(milkDTO.getDescription());
        product.setShortDescription(milkDTO.getDescription() != null && milkDTO.getDescription().length() > 200 
                ? milkDTO.getDescription().substring(0, 197) + "..." 
                : milkDTO.getDescription());
        
        Product.ProductStatus status = Product.ProductStatus.ACTIVE;
        if (milkDTO.getProductStatus() != null) {
            try {
                status = Product.ProductStatus.valueOf(milkDTO.getProductStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // fallback to ACTIVE
            }
        }
        product.setProductStatus(status);
        product.setSku(milkDTO.getSku() != null && !milkDTO.getSku().isEmpty() 
                ? milkDTO.getSku() 
                : "MLK-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
        
        Product savedProduct = productRepository.save(product);

        // 4. Save ProductInventory
        ProductInventory inventory = new ProductInventory();
        inventory.setProduct(savedProduct);
        inventory.setQuantityAvailable(milkDTO.getQuantity() != null ? milkDTO.getQuantity() : 0);
        inventory.setQuantityReserved(0);
        inventory.setQuantitySold(0);
        inventory.setReorderLevel(10);
        productInventoryRepository.save(inventory);
        savedProduct.setInventory(inventory);

        // 5. Save ProductImages
        if (milkDTO.getImages() != null && !milkDTO.getImages().isEmpty()) {
            java.util.Set<ProductImage> imageSet = new java.util.HashSet<>();
            int order = 0;
            for (com.smartkrishi.dto.product.ProductImageDTO imgDto : milkDTO.getImages()) {
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
        } else if (milkDTO.getImageUrls() != null && !milkDTO.getImageUrls().isEmpty()) {
            java.util.Set<ProductImage> imageSet = new java.util.HashSet<>();
            int order = 0;
            for (String url : milkDTO.getImageUrls()) {
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

        // 6. Create Milk
        Milk milk = new Milk();
        milk.setProduct(savedProduct);
        milk.setMilkType(milkDTO.getMilkType() != null ? milkDTO.getMilkType() : "Cow");
        milk.setFatPercentage(milkDTO.getFatPercentage() != null ? milkDTO.getFatPercentage() : 3.5);
        milk.setDailyAvailability(milkDTO.getDailyAvailability() != null ? milkDTO.getDailyAvailability() : true);
        milk.setDeliveryRadius(milkDTO.getDeliveryRadius() != null ? milkDTO.getDeliveryRadius() : 5);

        Milk savedMilk = milkRepository.save(milk);
        return mapToDTO(savedMilk);
    }

    @Override
    @Transactional(readOnly = true)
    public MilkDTO getMilkById(Long id) {
        Milk milk = milkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milk", "id", id));
        return mapToDTO(milk);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MilkDTO> getAllMilks(Pageable pageable) {
        return milkRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MilkDTO> getMilksByType(String milkType, Pageable pageable) {
        return milkRepository.findByMilkTypeContainingIgnoreCase(milkType, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional
    public MilkDTO updateMilk(Long id, MilkDTO milkDTO) {
        log.info("Updating milk marketplace listing with ID: {}", id);
        Milk milk = milkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milk", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (milk.getProduct() == null || milk.getProduct().getSeller() == null || !milk.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        milk.setMilkType(milkDTO.getMilkType());
        milk.setFatPercentage(milkDTO.getFatPercentage());
        milk.setDailyAvailability(milkDTO.getDailyAvailability());
        milk.setDeliveryRadius(milkDTO.getDeliveryRadius());

        // Update parent Product
        Product product = milk.getProduct();
        if (product != null) {
            product.setProductName(milkDTO.getProductName());
            product.setPrice(milkDTO.getPrice() != null ? milkDTO.getPrice() : java.math.BigDecimal.ZERO);
            product.setProductDescription(milkDTO.getDescription());
            product.setShortDescription(milkDTO.getDescription() != null && milkDTO.getDescription().length() > 200 
                    ? milkDTO.getDescription().substring(0, 197) + "..." 
                    : milkDTO.getDescription());

            if (milkDTO.getProductStatus() != null) {
                try {
                    product.setProductStatus(Product.ProductStatus.valueOf(milkDTO.getProductStatus().toUpperCase()));
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
            inventory.setQuantityAvailable(milkDTO.getQuantity() != null ? milkDTO.getQuantity() : 0);
            productInventoryRepository.save(inventory);
            product.setInventory(inventory);

            // Update images
            if (milkDTO.getImages() != null) {
                product.getImages().clear();
                int order = 0;
                for (com.smartkrishi.dto.product.ProductImageDTO imgDto : milkDTO.getImages()) {
                    ProductImage img = new ProductImage();
                    img.setProduct(product);
                    img.setImageUrl(imgDto.getImageUrl());
                    img.setPublicId(imgDto.getPublicId());
                    img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : (order == 0));
                    img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : order++);
                    product.getImages().add(img);
                }
            } else if (milkDTO.getImageUrls() != null) {
                product.getImages().clear();
                int order = 0;
                for (String url : milkDTO.getImageUrls()) {
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

        Milk updated = milkRepository.save(milk);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteMilk(Long id) {
        Milk milk = milkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milk", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (milk.getProduct() == null || milk.getProduct().getSeller() == null || !milk.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        Product product = milk.getProduct();
        milkRepository.delete(milk);
        if (product != null) {
            productRepository.delete(product);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MilkDTO getMilkByProductId(Long productId) {
        Milk milk = milkRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Milk", "productId", productId));
        return mapToDTO(milk);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MilkDTO> getMilksFiltered(String keyword, String milkType, Double minFat, java.math.BigDecimal maxPrice, Pageable pageable) {
        return milkRepository.filterMilk(keyword, milkType, minFat, maxPrice, pageable)
                .map(this::mapToDTO);
    }

    private MilkDTO mapToDTO(Milk milk) {
        Product p = milk.getProduct();
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

        return MilkDTO.builder()
                .id(milk.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getProductName() : "Milk Yield")
                .sku(sku)
                .price(price)
                .description(desc)
                .quantity(qty)
                .imageUrls(imageUrlsList)
                .images(imagesList)
                .sellerId(sellerId)
                .sellerBusinessName(sellerName)
                .milkType(milk.getMilkType())
                .fatPercentage(milk.getFatPercentage())
                .dailyAvailability(milk.getDailyAvailability())
                .deliveryRadius(milk.getDeliveryRadius())
                .productStatus(productStatus)
                .createdAt(milk.getCreatedAt())
                .build();
    }
}
