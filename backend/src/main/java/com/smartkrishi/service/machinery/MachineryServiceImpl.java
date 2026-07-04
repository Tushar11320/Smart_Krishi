package com.smartkrishi.service.machinery;

import com.smartkrishi.dto.machinery.MachineryDTO;
import com.smartkrishi.dto.machinery.MachineryRentalBookingDTO;
import com.smartkrishi.entity.Category;
import com.smartkrishi.entity.Machinery;
import com.smartkrishi.entity.Product;
import com.smartkrishi.entity.ProductImage;
import com.smartkrishi.entity.ProductInventory;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.entity.User;
import com.smartkrishi.entity.MachineryRentalBooking;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.CategoryRepository;
import com.smartkrishi.repository.MachineryRepository;
import com.smartkrishi.repository.ProductInventoryRepository;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.repository.SellerProfileRepository;
import com.smartkrishi.repository.UserRepository;
import com.smartkrishi.repository.MachineryRentalBookingRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class MachineryServiceImpl implements MachineryService {

    private final MachineryRepository machineryRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductInventoryRepository productInventoryRepository;
    private final UserRepository userRepository;
    private final MachineryRentalBookingRepository machineryRentalBookingRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public MachineryDTO createMachinery(MachineryDTO machineryDTO) {
        log.info("Creating machinery marketplace listing: {}", machineryDTO.getProductName());

        // 1. Resolve Category
        Category category = categoryRepository.findByCategoryName("Machinery")
                .orElseGet(() -> {
                    Category cat = new Category();
                    cat.setCategoryName("Machinery");
                    cat.setDescription("Agricultural Machinery Category");
                    cat.setIsActive(true);
                    return categoryRepository.save(cat);
                });

        // 2. Resolve Authenticated SellerProfile & Verify Status
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated to list machinery");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found for user ID: " + principal.getId()));

        if (seller.getSellerStatus() != SellerProfile.SellerStatus.APPROVED) {
            throw new com.smartkrishi.exception.BadRequestException("Cannot create machinery listing. Seller status is not APPROVED: " + seller.getSellerStatus());
        }

        // 3. Create Product
        Product product = new Product();
        product.setCategory(category);
        product.setSeller(seller);
        product.setProductName(machineryDTO.getProductName());
        product.setPrice(machineryDTO.getPrice() != null ? machineryDTO.getPrice() : BigDecimal.ZERO);
        product.setProductDescription(machineryDTO.getDescription());
        product.setShortDescription(machineryDTO.getDescription() != null && machineryDTO.getDescription().length() > 200 
                ? machineryDTO.getDescription().substring(0, 197) + "..." 
                : machineryDTO.getDescription());
        
        Product.ProductStatus status = Product.ProductStatus.ACTIVE;
        if (machineryDTO.getProductStatus() != null) {
            try {
                status = Product.ProductStatus.valueOf(machineryDTO.getProductStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // fallback to ACTIVE
            }
        }
        product.setProductStatus(status);
        product.setSku(machineryDTO.getSku() != null && !machineryDTO.getSku().isEmpty() 
                ? machineryDTO.getSku() 
                : "MAC-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
        
        Product savedProduct = productRepository.save(product);

        // 4. Save ProductInventory
        ProductInventory inventory = new ProductInventory();
        inventory.setProduct(savedProduct);
        inventory.setQuantityAvailable(machineryDTO.getQuantityAvailable() != null ? machineryDTO.getQuantityAvailable() : 1);
        inventory.setQuantityReserved(0);
        inventory.setQuantitySold(0);
        inventory.setReorderLevel(2);
        productInventoryRepository.save(inventory);
        savedProduct.setInventory(inventory);

        // 5. Save ProductImages
        if (machineryDTO.getImages() != null && !machineryDTO.getImages().isEmpty()) {
            java.util.Set<ProductImage> imageSet = new java.util.HashSet<>();
            int order = 0;
            for (com.smartkrishi.dto.product.ProductImageDTO imgDto : machineryDTO.getImages()) {
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
        } else if (machineryDTO.getImageUrls() != null && !machineryDTO.getImageUrls().isEmpty()) {
            java.util.Set<ProductImage> imageSet = new java.util.HashSet<>();
            int order = 0;
            for (String url : machineryDTO.getImageUrls()) {
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

        // 6. Create Machinery specification extension
        Machinery machinery = new Machinery();
        machinery.setProduct(savedProduct);
        updateEntityFromDTO(machinery, machineryDTO);

        Machinery savedMachinery = machineryRepository.save(machinery);
        return mapToDTO(savedMachinery);
    }

    @Override
    @Transactional(readOnly = true)
    public MachineryDTO getMachineryById(Long id) {
        Machinery machinery = machineryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machinery", "id", id));
        return mapToDTO(machinery);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MachineryDTO> getAllMachinery(Pageable pageable) {
        log.debug("Fetching all machinery listings with pagination");
        try {
            return machineryRepository.findAll(pageable).map(this::mapToDTO);
        } catch (Exception ex) {
            log.error("Failed to fetch all machinery listings from repository", ex);
            return Page.empty(pageable);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MachineryDTO> getMachineryByType(String type, Pageable pageable) {
        log.debug("Fetching machinery listings by type: {}", type);
        try {
            if (type == null || type.trim().isEmpty()) {
                return Page.empty(pageable);
            }
            return machineryRepository.findByMachineryTypeContainingIgnoreCase(type, pageable)
                    .map(this::mapToDTO);
        } catch (Exception ex) {
            log.error("Failed to fetch machinery listings by type: {}", type, ex);
            return Page.empty(pageable);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MachineryDTO> getMachineryByBrand(String brand, Pageable pageable) {
        log.debug("Fetching machinery listings by brand: {}", brand);
        try {
            if (brand == null || brand.trim().isEmpty()) {
                return Page.empty(pageable);
            }
            return machineryRepository.findByBrandNameContainingIgnoreCase(brand, pageable)
                    .map(this::mapToDTO);
        } catch (Exception ex) {
            log.error("Failed to fetch machinery listings by brand: {}", brand, ex);
            return Page.empty(pageable);
        }
    }

    @Override
    @Transactional
    public MachineryDTO updateMachinery(Long id, MachineryDTO machineryDTO) {
        log.info("Updating machinery marketplace listing with ID: {}", id);
        Machinery machinery = machineryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machinery", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (machinery.getProduct() == null || machinery.getProduct().getSeller() == null || !machinery.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        updateEntityFromDTO(machinery, machineryDTO);

        // Update parent Product
        Product product = machinery.getProduct();
        if (product != null) {
            product.setProductName(machineryDTO.getProductName());
            product.setPrice(machineryDTO.getPrice() != null ? machineryDTO.getPrice() : BigDecimal.ZERO);
            product.setProductDescription(machineryDTO.getDescription());
            product.setShortDescription(machineryDTO.getDescription() != null && machineryDTO.getDescription().length() > 200 
                    ? machineryDTO.getDescription().substring(0, 197) + "..." 
                    : machineryDTO.getDescription());

            if (machineryDTO.getProductStatus() != null) {
                try {
                    product.setProductStatus(Product.ProductStatus.valueOf(machineryDTO.getProductStatus().toUpperCase()));
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
                inventory.setReorderLevel(2);
            }
            inventory.setQuantityAvailable(machineryDTO.getQuantityAvailable() != null ? machineryDTO.getQuantityAvailable() : 1);
            productInventoryRepository.save(inventory);
            product.setInventory(inventory);

            // Update images
            if (machineryDTO.getImages() != null) {
                product.getImages().clear();
                int order = 0;
                for (com.smartkrishi.dto.product.ProductImageDTO imgDto : machineryDTO.getImages()) {
                    ProductImage img = new ProductImage();
                    img.setProduct(product);
                    img.setImageUrl(imgDto.getImageUrl());
                    img.setPublicId(imgDto.getPublicId());
                    img.setIsPrimary(imgDto.getIsPrimary() != null ? imgDto.getIsPrimary() : (order == 0));
                    img.setDisplayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : order++);
                    product.getImages().add(img);
                }
            } else if (machineryDTO.getImageUrls() != null) {
                product.getImages().clear();
                int order = 0;
                for (String url : machineryDTO.getImageUrls()) {
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

        Machinery updated = machineryRepository.save(machinery);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteMachinery(Long id) {
        Machinery machinery = machineryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machinery", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (machinery.getProduct() == null || machinery.getProduct().getSeller() == null || !machinery.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        Product product = machinery.getProduct();
        machineryRepository.delete(machinery);
        if (product != null) {
            productRepository.delete(product);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MachineryDTO getMachineryByProductId(Long productId) {
        Machinery machinery = machineryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Machinery", "productId", productId));
        return mapToDTO(machinery);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MachineryDTO> getMachineryFiltered(
            String keyword,
            String brand,
            String category,
            String state,
            String condition,
            Boolean forSale,
            Boolean forRent,
            BigDecimal maxPrice,
            Pageable pageable) {
        log.info("Filtering machinery listings - keyword: {}, brand: {}, category: {}, state: {}, condition: {}, forSale: {}, forRent: {}, maxPrice: {}", 
                keyword, brand, category, state, condition, forSale, forRent, maxPrice);
        try {
            // Build dynamic JPQL query for data
            StringBuilder jpql = new StringBuilder("SELECT m FROM Machinery m JOIN m.product p WHERE p.deletedAt IS NULL AND p.productStatus = 'ACTIVE'");
            StringBuilder countJpql = new StringBuilder("SELECT COUNT(m) FROM Machinery m JOIN m.product p WHERE p.deletedAt IS NULL AND p.productStatus = 'ACTIVE'");
            
            java.util.Map<String, Object> params = new java.util.HashMap<>();
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                String keywordLower = "%" + keyword.trim().toLowerCase() + "%";
                jpql.append(" AND (LOWER(p.productName) LIKE :keyword OR LOWER(m.brandName) LIKE :keyword OR LOWER(m.modelNumber) LIKE :keyword OR LOWER(p.productDescription) LIKE :keyword)");
                countJpql.append(" AND (LOWER(p.productName) LIKE :keyword OR LOWER(m.brandName) LIKE :keyword OR LOWER(m.modelNumber) LIKE :keyword OR LOWER(p.productDescription) LIKE :keyword)");
                params.put("keyword", keywordLower);
            }
            
            if (brand != null && !brand.trim().isEmpty()) {
                jpql.append(" AND LOWER(m.brandName) = :brand");
                countJpql.append(" AND LOWER(m.brandName) = :brand");
                params.put("brand", brand.trim().toLowerCase());
            }
            
            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) {
                jpql.append(" AND LOWER(m.machineryType) = :category");
                countJpql.append(" AND LOWER(m.machineryType) = :category");
                params.put("category", category.trim().toLowerCase());
            }
            
            if (state != null && !state.trim().isEmpty()) {
                jpql.append(" AND LOWER(m.state) = :state");
                countJpql.append(" AND LOWER(m.state) = :state");
                params.put("state", state.trim().toLowerCase());
            }
            
            if (condition != null && !condition.trim().isEmpty()) {
                jpql.append(" AND LOWER(m.conditionStatus) = :condition");
                countJpql.append(" AND LOWER(m.conditionStatus) = :condition");
                params.put("condition", condition.trim().toLowerCase());
            }
            
            if (forSale != null) {
                jpql.append(" AND (m.availableForSale = :forSale OR m.availableForBoth = :forSale)");
                countJpql.append(" AND (m.availableForSale = :forSale OR m.availableForBoth = :forSale)");
                params.put("forSale", forSale);
            }
            
            if (forRent != null) {
                jpql.append(" AND (m.availableForRent = :forRent OR m.availableForBoth = :forRent)");
                countJpql.append(" AND (m.availableForRent = :forRent OR m.availableForBoth = :forRent)");
                params.put("forRent", forRent);
            }
            
            if (maxPrice != null) {
                jpql.append(" AND p.price <= :maxPrice");
                countJpql.append(" AND p.price <= :maxPrice");
                params.put("maxPrice", maxPrice);
            }
            
            // Handle pagination sorting if specified in pageable
            if (pageable != null && pageable.getSort() != null && pageable.getSort().isSorted()) {
                jpql.append(" ORDER BY ");
                String orderStr = pageable.getSort().stream()
                        .map(order -> {
                            String prop = order.getProperty();
                            // Map property names from DTO/Entity to JPQL fields
                            if (prop.equals("price") || prop.equals("productName")) {
                                return "p." + prop + " " + order.getDirection().name();
                            }
                            return "m." + prop + " " + order.getDirection().name();
                        })
                        .collect(Collectors.joining(", "));
                jpql.append(orderStr);
            } else {
                jpql.append(" ORDER BY m.id DESC");
            }
            
            // Create query
            TypedQuery<Machinery> query = entityManager.createQuery(jpql.toString(), Machinery.class);
            TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);
            
            // Bind parameters
            for (java.util.Map.Entry<String, Object> entry : params.entrySet()) {
                query.setParameter(entry.getKey(), entry.getValue());
                countQuery.setParameter(entry.getKey(), entry.getValue());
            }
            
            // Get total count
            Long total = countQuery.getSingleResult();
            if (total == null || total == 0L) {
                return Page.empty(pageable);
            }
            
            // Apply pagination limit/offset
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
            
            List<MachineryDTO> content = query.getResultList().stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
            
            log.info("Successfully retrieved {} filtered machinery listings. Total match count: {}", content.size(), total);
            return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
        } catch (Exception ex) {
            log.error("Failed to fetch machinery listings from repository using dynamic search", ex);
            // Return empty page instead of exceptions
            return Page.empty(pageable);
        }
    }
    
    // Rental slots booking stub, no owner checks needed as this is a buyer operation.

    @Override
    @Transactional
    public MachineryRentalBookingDTO bookRental(MachineryRentalBookingDTO dto) {
        log.info("Booking rental slot for machinery ID: {}", dto.getMachineryId());
        
        Machinery machinery = machineryRepository.findById(dto.getMachineryId())
                .orElseThrow(() -> new ResourceNotFoundException("Machinery", "id", dto.getMachineryId()));
        
        User buyer = userRepository.findById(dto.getBuyerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getBuyerId()));

        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date.");
        }

        // Check date overlapping
        List<MachineryRentalBooking> overlaps = machineryRentalBookingRepository.findOverlappingBookings(
                dto.getMachineryId(), dto.getStartDate(), dto.getEndDate()
        );
        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException("The selected dates overlap with an existing booking.");
        }

        // Calculate totalPrice
        long days = java.time.temporal.ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;
        BigDecimal dailyPrice = machinery.getRentPerDay() != null ? machinery.getRentPerDay() : BigDecimal.ZERO;
        BigDecimal calculatedTotal = dailyPrice.multiply(BigDecimal.valueOf(days));
        BigDecimal securityDeposit = machinery.getSecurityDeposit() != null ? machinery.getSecurityDeposit() : BigDecimal.ZERO;

        MachineryRentalBooking booking = new MachineryRentalBooking();
        booking.setMachinery(machinery);
        booking.setBuyer(buyer);
        booking.setStartDate(dto.getStartDate());
        booking.setEndDate(dto.getEndDate());
        booking.setTotalPrice(calculatedTotal);
        booking.setSecurityDeposit(securityDeposit);
        booking.setBookingStatus("PENDING");
        booking.setReturnConfirmed(false);

        MachineryRentalBooking saved = machineryRentalBookingRepository.save(booking);
        return mapToBookingDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MachineryRentalBookingDTO> getBookingsByBuyerId(Long buyerId) {
        return machineryRentalBookingRepository.findByBuyerId(buyerId)
                .stream().map(this::mapToBookingDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MachineryRentalBookingDTO> getBookingsBySellerId(Long sellerId) {
        return machineryRentalBookingRepository.findBySellerId(sellerId)
                .stream().map(this::mapToBookingDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MachineryRentalBookingDTO> getBookingsByMachineryId(Long machineryId) {
        return machineryRentalBookingRepository.findByMachineryId(machineryId)
                .stream().map(this::mapToBookingDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MachineryRentalBookingDTO updateBookingStatus(Long bookingId, String status) {
        MachineryRentalBooking booking = machineryRentalBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("MachineryRentalBooking", "id", bookingId));
        
        booking.setBookingStatus(status.toUpperCase());
        if ("COMPLETED".equalsIgnoreCase(status)) {
            booking.setReturnConfirmed(true);
        }
        MachineryRentalBooking saved = machineryRentalBookingRepository.save(booking);
        return mapToBookingDTO(saved);
    }

    private MachineryRentalBookingDTO mapToBookingDTO(MachineryRentalBooking rb) {
        Product p = rb.getMachinery().getProduct();
        return MachineryRentalBookingDTO.builder()
                .id(rb.getId())
                .machineryId(rb.getMachinery().getId())
                .productId(p != null ? p.getId() : null)
                .machineryName(p != null ? p.getProductName() : rb.getMachinery().getMachineryType())
                .machineryType(rb.getMachinery().getMachineryType())
                .brandName(rb.getMachinery().getBrandName())
                .modelNumber(rb.getMachinery().getModelNumber())
                .conditionStatus(rb.getMachinery().getConditionStatus())
                
                .buyerId(rb.getBuyer().getId())
                .buyerName(rb.getBuyer().getFirstName() + " " + rb.getBuyer().getLastName())
                .buyerPhone(rb.getBuyer().getPhone())
                .buyerEmail(rb.getBuyer().getEmail())
                
                .sellerId(p != null && p.getSeller() != null ? p.getSeller().getId() : null)
                .sellerBusinessName(p != null && p.getSeller() != null ? p.getSeller().getBusinessName() : null)
                
                .startDate(rb.getStartDate())
                .endDate(rb.getEndDate())
                .totalPrice(rb.getTotalPrice())
                .securityDeposit(rb.getSecurityDeposit())
                .bookingStatus(rb.getBookingStatus())
                .returnConfirmed(rb.getReturnConfirmed())
                .createdAt(rb.getCreatedAt())
                .build();
    }

    private MachineryDTO mapToDTO(Machinery machinery) {
        Product p = machinery.getProduct();
        List<String> imageUrlsList = new java.util.ArrayList<>();
        List<com.smartkrishi.dto.product.ProductImageDTO> imagesList = new java.util.ArrayList<>();
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

        return MachineryDTO.builder()
                .id(machinery.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getProductName() : machinery.getMachineryType())
                .sku(sku)
                .description(desc)
                .price(price)
                .quantityAvailable(qty)
                .imageUrls(imageUrlsList)
                .images(imagesList)
                .sellerId(sellerId)
                .sellerBusinessName(sellerName)
                
                .machineryType(machinery.getMachineryType())
                .brandName(machinery.getBrandName())
                .modelNumber(machinery.getModelNumber())
                .engineType(machinery.getEngineType())
                .powerHp(machinery.getPowerHp())
                .capacitySpecification(machinery.getCapacitySpecification())
                .maintenanceIntervalHours(machinery.getMaintenanceIntervalHours())
                .warrantyYears(machinery.getWarrantyYears())
                .fuelEfficiency(machinery.getFuelEfficiency())
                .noiseLevelDb(machinery.getNoiseLevelDb())
                
                .manufacturingYear(machinery.getManufacturingYear())
                .conditionStatus(machinery.getConditionStatus())
                .negotiable(machinery.getNegotiable())
                .rentPerHour(machinery.getRentPerHour())
                .rentPerDay(machinery.getRentPerDay())
                .rentPerWeek(machinery.getRentPerWeek())
                .securityDeposit(machinery.getSecurityDeposit())
                .availableForSale(machinery.getAvailableForSale())
                .availableForRent(machinery.getAvailableForRent())
                .availableForBoth(machinery.getAvailableForBoth())
                
                .state(machinery.getState())
                .district(machinery.getDistrict())
                .villageCity(machinery.getVillageCity())
                .pincode(machinery.getPincode())
                .gpsLocation(machinery.getGpsLocation())
                
                .videoUrl(machinery.getVideoUrl())
                .registrationCertificateUrl(machinery.getRegistrationCertificateUrl())
                .insuranceDocumentUrl(machinery.getInsuranceDocumentUrl())
                
                .enginePower(machinery.getEnginePower())
                .fuelType(machinery.getFuelType())
                .workingWidth(machinery.getWorkingWidth())
                .weight(machinery.getWeight())
                .otherSpecifications(machinery.getOtherSpecifications())
                
                .sellerContactName(machinery.getSellerContactName())
                .mobileNumber(machinery.getMobileNumber())
                .alternateNumber(machinery.getAlternateNumber())
                .whatsappNumber(machinery.getWhatsappNumber())
                .productStatus(productStatus)
                .createdAt(machinery.getCreatedAt())
                .build();
    }

    private void updateEntityFromDTO(Machinery m, MachineryDTO dto) {
        m.setMachineryType(dto.getMachineryType());
        m.setBrandName(dto.getBrandName());
        m.setModelNumber(dto.getModelNumber());
        m.setEngineType(dto.getEngineType());
        m.setPowerHp(dto.getPowerHp());
        m.setCapacitySpecification(dto.getCapacitySpecification());
        m.setMaintenanceIntervalHours(dto.getMaintenanceIntervalHours());
        m.setWarrantyYears(dto.getWarrantyYears());
        m.setFuelEfficiency(dto.getFuelEfficiency());
        m.setNoiseLevelDb(dto.getNoiseLevelDb());
        
        m.setManufacturingYear(dto.getManufacturingYear());
        m.setConditionStatus(dto.getConditionStatus());
        m.setNegotiable(dto.getNegotiable() != null ? dto.getNegotiable() : false);
        m.setRentPerHour(dto.getRentPerHour());
        m.setRentPerDay(dto.getRentPerDay());
        m.setRentPerWeek(dto.getRentPerWeek());
        m.setSecurityDeposit(dto.getSecurityDeposit());
        m.setAvailableForSale(dto.getAvailableForSale() != null ? dto.getAvailableForSale() : true);
        m.setAvailableForRent(dto.getAvailableForRent() != null ? dto.getAvailableForRent() : false);
        m.setAvailableForBoth(dto.getAvailableForBoth() != null ? dto.getAvailableForBoth() : false);
        
        m.setState(dto.getState());
        m.setDistrict(dto.getDistrict());
        m.setVillageCity(dto.getVillageCity());
        m.setPincode(dto.getPincode());
        m.setGpsLocation(dto.getGpsLocation());
        
        m.setVideoUrl(dto.getVideoUrl());
        m.setRegistrationCertificateUrl(dto.getRegistrationCertificateUrl());
        m.setInsuranceDocumentUrl(dto.getInsuranceDocumentUrl());
        
        m.setEnginePower(dto.getEnginePower());
        m.setFuelType(dto.getFuelType());
        m.setWorkingWidth(dto.getWorkingWidth());
        m.setWeight(dto.getWeight());
        m.setOtherSpecifications(dto.getOtherSpecifications());
        
        m.setSellerContactName(dto.getSellerContactName());
        m.setMobileNumber(dto.getMobileNumber());
        m.setAlternateNumber(dto.getAlternateNumber());
        m.setWhatsappNumber(dto.getWhatsappNumber());
    }
}
