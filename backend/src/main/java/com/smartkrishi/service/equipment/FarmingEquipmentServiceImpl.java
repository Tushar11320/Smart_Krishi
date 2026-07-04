package com.smartkrishi.service.equipment;

import com.smartkrishi.dto.equipment.FarmingEquipmentDTO;
import com.smartkrishi.dto.equipment.RentalBookingDTO;
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
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class FarmingEquipmentServiceImpl implements FarmingEquipmentService {

    private final FarmingEquipmentRepository farmingEquipmentRepository;
    private final RentalBookingRepository rentalBookingRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductInventoryRepository productInventoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public FarmingEquipmentDTO createEquipment(FarmingEquipmentDTO dto) {
        log.info("Creating farming equipment listing: {}", dto.getEquipmentName());

        // 1. Resolve Category
        Category category = categoryRepository.findByCategoryName("Farming Equipment")
                .orElseGet(() -> {
                    Category cat = new Category();
                    cat.setCategoryName("Farming Equipment");
                    cat.setDescription("Farming Equipment Category");
                    cat.setIsActive(true);
                    return categoryRepository.save(cat);
                });

        // 2. Resolve Authenticated SellerProfile & Verify Status
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated to list farming equipment");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found for user ID: " + principal.getId()));

        if (seller.getSellerStatus() != SellerProfile.SellerStatus.APPROVED) {
            throw new com.smartkrishi.exception.BadRequestException("Cannot create farming equipment listing. Seller status is not APPROVED: " + seller.getSellerStatus());
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
                : "EQP-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));

        Product savedProduct = productRepository.save(product);

        // 4. Save Inventory
        ProductInventory inventory = new ProductInventory();
        inventory.setProduct(savedProduct);
        inventory.setQuantityAvailable(dto.getQuantity() != null ? dto.getQuantity() : 1);
        inventory.setQuantityReserved(0);
        inventory.setQuantitySold(0);
        inventory.setReorderLevel(1);
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

        // 6. Create FarmingEquipment
        FarmingEquipment equipment = new FarmingEquipment();
        equipment.setProduct(savedProduct);
        equipment.setEquipmentName(dto.getEquipmentName());
        equipment.setBrand(dto.getBrand() != null ? dto.getBrand() : "General");
        equipment.setModel(dto.getModel());
        equipment.setPurchaseYear(dto.getPurchaseYear());
        equipment.setEquipmentCondition(dto.getEquipmentCondition() != null ? dto.getEquipmentCondition() : "GOOD");
        equipment.setRentPerHour(dto.getRentPerHour());
        equipment.setRentPerDay(dto.getRentPerDay());
        equipment.setSecurityDeposit(dto.getSecurityDeposit());
        equipment.setForSale(dto.getForSale() != null ? dto.getForSale() : true);
        equipment.setForRent(dto.getForRent() != null ? dto.getForRent() : false);

        FarmingEquipment saved = farmingEquipmentRepository.save(equipment);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmingEquipmentDTO getEquipmentById(Long id) {
        FarmingEquipment equipment = farmingEquipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FarmingEquipment", "id", id));
        return mapToDTO(equipment);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmingEquipmentDTO getEquipmentByProductId(Long productId) {
        FarmingEquipment equipment = farmingEquipmentRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("FarmingEquipment", "productId", productId));
        return mapToDTO(equipment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FarmingEquipmentDTO> getAllEquipment(Pageable pageable) {
        return farmingEquipmentRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public FarmingEquipmentDTO updateEquipment(Long id, FarmingEquipmentDTO dto) {
        log.info("Updating farming equipment listing ID: {}", id);
        FarmingEquipment equipment = farmingEquipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FarmingEquipment", "id", id));

        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (equipment.getProduct() == null || equipment.getProduct().getSeller() == null || !equipment.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        equipment.setEquipmentName(dto.getEquipmentName());
        equipment.setBrand(dto.getBrand());
        equipment.setModel(dto.getModel());
        equipment.setPurchaseYear(dto.getPurchaseYear());
        equipment.setEquipmentCondition(dto.getEquipmentCondition());
        equipment.setRentPerHour(dto.getRentPerHour());
        equipment.setRentPerDay(dto.getRentPerDay());
        equipment.setSecurityDeposit(dto.getSecurityDeposit());
        equipment.setForSale(dto.getForSale() != null ? dto.getForSale() : true);
        equipment.setForRent(dto.getForRent() != null ? dto.getForRent() : false);

        // Update Product
        Product product = equipment.getProduct();
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
                inventory.setReorderLevel(1);
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

        FarmingEquipment updated = farmingEquipmentRepository.save(equipment);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteEquipment(Long id) {
        FarmingEquipment equipment = farmingEquipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FarmingEquipment", "id", id));
        
        // Ownership Check
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.smartkrishi.exception.BadRequestException("User must be authenticated");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new com.smartkrishi.exception.BadRequestException("Seller profile not found"));
        
        if (!isAdmin && (equipment.getProduct() == null || equipment.getProduct().getSeller() == null || !equipment.getProduct().getSeller().getId().equals(seller.getId()))) {
            throw new com.smartkrishi.exception.BadRequestException("Unauthorized: You do not own this listing");
        }

        Product product = equipment.getProduct();
        farmingEquipmentRepository.delete(equipment);
        if (product != null) {
            productRepository.delete(product);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FarmingEquipmentDTO> getEquipmentFiltered(
            String keyword, String brand, String condition,
            Boolean forSale, Boolean forRent, BigDecimal maxPrice,
            Pageable pageable) {
        return farmingEquipmentRepository.filterEquipment(keyword, brand, condition, forSale, forRent, maxPrice, pageable)
                .map(this::mapToDTO);
    }

    // Renting operations
    @Override
    @Transactional
    public RentalBookingDTO bookRental(RentalBookingDTO dto) {
        log.info("Booking rental slot for equipment ID: {}", dto.getFarmingEquipmentId());

        FarmingEquipment equipment = farmingEquipmentRepository.findById(dto.getFarmingEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("FarmingEquipment", "id", dto.getFarmingEquipmentId()));

        User buyer = userRepository.findById(dto.getBuyerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getBuyerId()));

        // Date ranges validation
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date.");
        }
        if (dto.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past.");
        }

        // Overlap validation
        List<RentalBooking> overlaps = rentalBookingRepository.findOverlappingBookings(
                dto.getFarmingEquipmentId(), dto.getStartDate(), dto.getEndDate()
        );
        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException("The selected dates overlap with an existing booking.");
        }

        // Calculate rental price
        long days = ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;
        BigDecimal dailyRate = equipment.getRentPerDay() != null ? equipment.getRentPerDay() : BigDecimal.ZERO;
        BigDecimal deposit = equipment.getSecurityDeposit() != null ? equipment.getSecurityDeposit() : BigDecimal.ZERO;
        BigDecimal calculatedTotal = dailyRate.multiply(BigDecimal.valueOf(days)).add(deposit);

        RentalBooking booking = new RentalBooking();
        booking.setFarmingEquipment(equipment);
        booking.setBuyer(buyer);
        booking.setStartDate(dto.getStartDate());
        booking.setEndDate(dto.getEndDate());
        booking.setTotalPrice(calculatedTotal);
        booking.setBookingStatus("PENDING");

        RentalBooking saved = rentalBookingRepository.save(booking);
        return mapToBookingDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalBookingDTO> getBookingsByEquipmentId(Long equipmentId) {
        return rentalBookingRepository.findByFarmingEquipmentId(equipmentId)
                .stream().map(this::mapToBookingDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalBookingDTO> getBookingsByBuyerId(Long buyerId) {
        return rentalBookingRepository.findByBuyerId(buyerId)
                .stream().map(this::mapToBookingDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalBookingDTO> getBookingsBySellerId(Long sellerId) {
        return rentalBookingRepository.findBySellerId(sellerId)
                .stream().map(this::mapToBookingDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RentalBookingDTO updateBookingStatus(Long bookingId, String status) {
        RentalBooking booking = rentalBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("RentalBooking", "id", bookingId));

        booking.setBookingStatus(status.toUpperCase());
        RentalBooking saved = rentalBookingRepository.save(booking);
        return mapToBookingDTO(saved);
    }

    private FarmingEquipmentDTO mapToDTO(FarmingEquipment fe) {
        Product p = fe.getProduct();
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

        return FarmingEquipmentDTO.builder()
                .id(fe.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getProductName() : fe.getEquipmentName())
                .sku(sku)
                .price(price)
                .description(desc)
                .quantity(qty)
                .imageUrls(imageUrlsList)
                .images(imagesList)
                .sellerId(sellerId)
                .sellerBusinessName(sellerName)
                .equipmentName(fe.getEquipmentName())
                .brand(fe.getBrand())
                .model(fe.getModel())
                .purchaseYear(fe.getPurchaseYear())
                .equipmentCondition(fe.getEquipmentCondition())
                .rentPerHour(fe.getRentPerHour())
                .rentPerDay(fe.getRentPerDay())
                .securityDeposit(fe.getSecurityDeposit())
                .forSale(fe.getForSale())
                .forRent(fe.getForRent())
                .productStatus(productStatus)
                .createdAt(fe.getCreatedAt())
                .build();
    }

    private RentalBookingDTO mapToBookingDTO(RentalBooking rb) {
        return RentalBookingDTO.builder()
                .id(rb.getId())
                .farmingEquipmentId(rb.getFarmingEquipment().getId())
                .equipmentName(rb.getFarmingEquipment().getEquipmentName())
                .buyerId(rb.getBuyer().getId())
                .buyerName(rb.getBuyer().getFirstName() + " " + rb.getBuyer().getLastName())
                .buyerEmail(rb.getBuyer().getEmail())
                .startDate(rb.getStartDate())
                .endDate(rb.getEndDate())
                .totalPrice(rb.getTotalPrice())
                .bookingStatus(rb.getBookingStatus())
                .createdAt(rb.getCreatedAt())
                .build();
    }
}
