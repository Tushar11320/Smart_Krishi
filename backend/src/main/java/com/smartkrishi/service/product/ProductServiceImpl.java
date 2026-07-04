package com.smartkrishi.service.product;

import com.smartkrishi.dto.product.ProductDTO;
import com.smartkrishi.entity.Category;
import com.smartkrishi.entity.Product;
import com.smartkrishi.entity.ProductInventory;
import com.smartkrishi.entity.SubCategory;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Comparator;
import com.smartkrishi.dto.product.ProductImageDTO;
import com.smartkrishi.dto.product.ProductInventoryDTO;
import com.smartkrishi.entity.ProductImage;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subcategoryRepository;
    private final ProductInventoryRepository productInventoryRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public ProductDTO createProduct(ProductDTO productDTO) {
        // Retrieve currently authenticated user and check seller status
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new BadRequestException("User must be authenticated to create a product");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new BadRequestException("Seller profile not found for user ID: " + principal.getId()));

        if (seller.getSellerStatus() != SellerProfile.SellerStatus.APPROVED) {
            throw new BadRequestException("Cannot create product. Seller status is not APPROVED: " + seller.getSellerStatus());
        }

        // Check if SKU already exists
        if (productRepository.findBySku(productDTO.getSku()).isPresent()) {
            throw new BadRequestException("Product with SKU " + productDTO.getSku() + " already exists");
        }

        // Get category
        Category category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // Get subcategory if provided
        SubCategory subcategory = null;
        if (productDTO.getSubcategoryId() != null) {
            subcategory = subcategoryRepository.findById(productDTO.getSubcategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subcategory not found"));
        }

        // Create product
        Product product = new Product();
        product.setSeller(seller);
        product.setProductName(productDTO.getProductName());
        product.setSku(productDTO.getSku());
        product.setProductDescription(productDTO.getProductDescription());
        product.setShortDescription(productDTO.getShortDescription());
        product.setPrice(productDTO.getPrice());
        product.setDiscountPrice(productDTO.getDiscountPrice());
        product.setDiscountPercentage(productDTO.getDiscountPercentage());
        product.setCategory(category);
        product.setSubcategory(subcategory);
        product.setProductStatus(Product.ProductStatus.ACTIVE);
        product.setIsFeatured(productDTO.getIsFeatured() != null && productDTO.getIsFeatured());
        product.setIsBestseller(productDTO.getIsBestseller() != null && productDTO.getIsBestseller());
        product.setLatitude(productDTO.getLatitude());
        product.setLongitude(productDTO.getLongitude());
        product.setAddress(productDTO.getAddress());
        product.setRating(BigDecimal.ZERO);
        product.setReviewCount(0);
        product.setPurchaseCount(0);
        product.setViewCount(0);

        Product savedProduct = productRepository.save(product);

        // Create inventory
        ProductInventory inventory = new ProductInventory();
        inventory.setProduct(savedProduct);
        if (productDTO.getInventory() != null && productDTO.getInventory().getQuantityAvailable() != null) {
            inventory.setQuantityAvailable(productDTO.getInventory().getQuantityAvailable());
        } else {
            inventory.setQuantityAvailable(0);
        }
        if (productDTO.getInventory() != null && productDTO.getInventory().getReorderLevel() != null) {
            inventory.setReorderLevel(productDTO.getInventory().getReorderLevel());
        } else {
            inventory.setReorderLevel(10);
        }
        if (productDTO.getInventory() != null && productDTO.getInventory().getReorderQuantity() != null) {
            inventory.setReorderQuantity(productDTO.getInventory().getReorderQuantity());
        } else {
            inventory.setReorderQuantity(50);
        }
        inventory.setQuantityReserved(0);
        inventory.setQuantitySold(0);
        productInventoryRepository.save(inventory);
        savedProduct.setInventory(inventory);

        // Save images
        if (productDTO.getImages() != null && !productDTO.getImages().isEmpty()) {
            for (ProductImageDTO imgDto : productDTO.getImages()) {
                ProductImage img = new ProductImage();
                img.setProduct(savedProduct);
                img.setImageUrl(imgDto.getImageUrl());
                img.setPublicId(imgDto.getPublicId());
                img.setIsPrimary(imgDto.getIsPrimary() != null && imgDto.getIsPrimary());
                img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : 0);
                savedProduct.getImages().add(img);
            }
            productRepository.save(savedProduct);
        }

        log.info("Product created with SKU: {}", savedProduct.getSku());

        return mapProductToDTO(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Increment view count
        product.setViewCount(product.getViewCount() + 1);
        productRepository.save(product);

        return mapProductToDTO(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        return productRepository.findByProductStatus(Product.ProductStatus.ACTIVE, pageable)
                .map(this::mapProductToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryId(categoryId, pageable)
                .map(this::mapProductToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsBySubcategory(Long subcategoryId, Pageable pageable) {
        return productRepository.findBySubcategoryId(subcategoryId, pageable)
                .map(this::mapProductToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsBySeller(Long sellerId, Pageable pageable) {
        return productRepository.findBySellerIdAndProductStatus(sellerId, Product.ProductStatus.ACTIVE, pageable)
                .map(this::mapProductToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(String keyword, Pageable pageable) {
        return productRepository.searchByKeyword(keyword, pageable)
                .map(this::mapProductToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "'featured'")
    public List<ProductDTO> getFeaturedProducts() {
        return productRepository.findFeaturedProducts(PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(this::mapProductToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "'bestsellers'")
    public List<ProductDTO> getBestsellers() {
        return productRepository.findBestsellerProducts(PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(this::mapProductToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Validate BOLA / Ownership
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof com.smartkrishi.security.UserPrincipal)) {
            throw new org.springframework.security.access.AccessDeniedException("User must be authenticated to update a product");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin) {
            SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Seller profile not found for user ID: " + principal.getId()));
            if (product.getSeller() == null || !product.getSeller().getId().equals(seller.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You are not authorized to update this product");
            }
        }

        product.setProductName(productDTO.getProductName());
        product.setProductDescription(productDTO.getProductDescription());
        product.setShortDescription(productDTO.getShortDescription());
        product.setPrice(productDTO.getPrice());
        product.setDiscountPrice(productDTO.getDiscountPrice());
        product.setDiscountPercentage(productDTO.getDiscountPercentage());
        product.setIsFeatured(productDTO.getIsFeatured() != null && productDTO.getIsFeatured());
        product.setIsBestseller(productDTO.getIsBestseller() != null && productDTO.getIsBestseller());
        product.setLatitude(productDTO.getLatitude());
        product.setLongitude(productDTO.getLongitude());
        product.setAddress(productDTO.getAddress());

        if (productDTO.getProductStatus() != null) {
            product.setProductStatus(Product.ProductStatus.valueOf(productDTO.getProductStatus().toUpperCase()));
        }

        // Category updates
        if (productDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(productDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        // Subcategory updates
        if (productDTO.getSubcategoryId() != null) {
            SubCategory subcategory = subcategoryRepository.findById(productDTO.getSubcategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subcategory not found"));
            product.setSubcategory(subcategory);
        } else {
            product.setSubcategory(null);
        }

        // Inventory / Stock updates
        if (productDTO.getInventory() != null) {
            ProductInventory inventory = product.getInventory();
            if (inventory == null) {
                inventory = new ProductInventory();
                inventory.setProduct(product);
                inventory.setQuantityReserved(0);
                inventory.setQuantitySold(0);
            }
            if (productDTO.getInventory().getQuantityAvailable() != null) {
                inventory.setQuantityAvailable(productDTO.getInventory().getQuantityAvailable());
            }
            if (productDTO.getInventory().getReorderLevel() != null) {
                inventory.setReorderLevel(productDTO.getInventory().getReorderLevel());
            }
            if (productDTO.getInventory().getReorderQuantity() != null) {
                inventory.setReorderQuantity(productDTO.getInventory().getReorderQuantity());
            }
            productInventoryRepository.save(inventory);
            product.setInventory(inventory);
        }

        // Images updates
        if (productDTO.getImages() != null) {
            product.getImages().clear();
            productRepository.saveAndFlush(product); // flush to delete orphan entities
            for (ProductImageDTO imgDto : productDTO.getImages()) {
                ProductImage img = new ProductImage();
                img.setProduct(product);
                img.setImageUrl(imgDto.getImageUrl());
                img.setPublicId(imgDto.getPublicId());
                img.setIsPrimary(imgDto.getIsPrimary() != null && imgDto.getIsPrimary());
                img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : 0);
                product.getImages().add(img);
            }
        }

        Product updatedProduct = productRepository.save(product);

        log.info("Product updated with ID: {}", id);

        return mapProductToDTO(updatedProduct);
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Validate BOLA / Ownership
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof com.smartkrishi.security.UserPrincipal)) {
            throw new org.springframework.security.access.AccessDeniedException("User must be authenticated to delete a product");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin) {
            SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Seller profile not found for user ID: " + principal.getId()));
            if (product.getSeller() == null || !product.getSeller().getId().equals(seller.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You are not authorized to delete this product");
            }
        }

        product.setProductStatus(Product.ProductStatus.INACTIVE);
        productRepository.save(product);

        log.info("Product deleted with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductBySku(String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with SKU: " + sku));

        return mapProductToDTO(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getSellerProductsAll(Long sellerId, Pageable pageable) {
        return productRepository.findBySellerIdAndDeletedAtIsNull(sellerId, pageable)
                .map(this::mapProductToDTO);
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
                .latitude(product.getLatitude())
                .longitude(product.getLongitude())
                .address(product.getAddress())
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

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProductsAdmin(Pageable pageable) {
        return productRepository.findByDeletedAtIsNull(pageable)
                .map(this::mapProductToDTO);
    }

    @Override
    public ProductDTO updateProductStatus(Long id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        try {
            product.setProductStatus(Product.ProductStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid product status: " + status);
        }
        
        Product saved = productRepository.save(product);
        log.info("Product status updated to {} for ID: {}", status, id);
        return mapProductToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getNearbyProducts(double latitude, double longitude, double radiusKm, String sortBy) {
        log.info("Finding products nearby: lat={}, lon={}, radius={}, sortBy={}", latitude, longitude, radiusKm, sortBy);
        List<Product> activeProducts = productRepository.findByProductStatus(Product.ProductStatus.ACTIVE);
        
        List<ProductDTO> nearby = new ArrayList<>();
        for (Product product : activeProducts) {
            Double prodLat = product.getLatitude();
            Double prodLon = product.getLongitude();
            
            // Fallback to seller location if product does not have its own location
            if (prodLat == null || prodLon == null) {
                if (product.getSeller() != null && product.getSeller().getLatitude() != null && product.getSeller().getLongitude() != null) {
                    prodLat = product.getSeller().getLatitude();
                    prodLon = product.getSeller().getLongitude();
                }
            }
            
            if (prodLat != null && prodLon != null) {
                double distance = calculateHaversineDistance(latitude, longitude, prodLat, prodLon);
                if (distance <= radiusKm) {
                    ProductDTO dto = mapProductToDTO(product);
                    dto.setDistance(Math.round(distance * 10.0) / 10.0); // round to 1 decimal place
                    dto.setLatitude(prodLat);
                    dto.setLongitude(prodLon);
                    nearby.add(dto);
                }
            }
        }
        
        // Sorting
        if ("price".equalsIgnoreCase(sortBy)) {
            nearby.sort(Comparator.comparing(ProductDTO::getPrice));
        } else if ("rating".equalsIgnoreCase(sortBy)) {
            nearby.sort((p1, p2) -> {
                BigDecimal r1 = p1.getRating() != null ? p1.getRating() : BigDecimal.ZERO;
                BigDecimal r2 = p2.getRating() != null ? p2.getRating() : BigDecimal.ZERO;
                return r2.compareTo(r1); // descending order of rating
            });
        } else {
            // default: sort by distance
            nearby.sort(Comparator.comparing(ProductDTO::getDistance));
        }
        
        return nearby;
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
