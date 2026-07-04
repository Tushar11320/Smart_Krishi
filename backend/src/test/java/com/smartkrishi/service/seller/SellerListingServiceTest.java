package com.smartkrishi.service.seller;

import com.smartkrishi.dto.product.ProductDTO;
import com.smartkrishi.dto.land.LandListingDTO;
import com.smartkrishi.dto.seller.SellerInventoryStatsDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SellerListingServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private LandListingRepository landListingRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private SellerListingServiceImpl sellerListingService;

    private User sellerUser;
    private User otherUser;
    private SellerProfile sellerProfile;
    private Category category;
    private Product activeProduct;
    private Product inventoryProduct;
    private LandListing availableLand;

    @BeforeEach
    public void setUp() {
        sellerUser = new User();
        sellerUser.setId(1L);
        sellerUser.setEmail("seller@test.com");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@test.com");

        sellerProfile = new SellerProfile();
        sellerProfile.setId(10L);
        sellerProfile.setUser(sellerUser);
        sellerProfile.setBusinessName("Test Krishi Shop");

        category = new Category();
        category.setId(100L);
        category.setCategoryName("Crops");

        activeProduct = new Product();
        activeProduct.setId(200L);
        activeProduct.setProductName("Organic Wheat");
        activeProduct.setSku("WHEAT-001");
        activeProduct.setPrice(BigDecimal.valueOf(50));
        activeProduct.setCategory(category);
        activeProduct.setSeller(sellerProfile);
        activeProduct.setProductStatus(Product.ProductStatus.ACTIVE);

        ProductInventory inventory = new ProductInventory();
        inventory.setId(500L);
        inventory.setQuantityAvailable(100);
        inventory.setQuantityReserved(10);
        inventory.setQuantitySold(50);
        inventory.setReorderLevel(20);
        inventory.setProduct(activeProduct);
        activeProduct.setInventory(inventory);

        availableLand = new LandListing();
        availableLand.setId(300L);
        availableLand.setLandTitle("Fertile Field");
        availableLand.setAreaInAcres(BigDecimal.valueOf(5));
        availableLand.setLandType("Agricultural");
        availableLand.setPricePerAcre(BigDecimal.valueOf(100000));
        availableLand.setState("Maharashtra");
        availableLand.setDistrict("Pune");
        availableLand.setTaluka("Mulshi");
        availableLand.setPinCode("412115");
        availableLand.setLatitude(BigDecimal.valueOf(18.5204));
        availableLand.setLongitude(BigDecimal.valueOf(73.8567));
        availableLand.setSeller(sellerProfile);
        availableLand.setLandStatus(LandListing.LandStatus.AVAILABLE);
    }

    @Test
    public void testGetSellerInventoryStats_Success() {
        List<Product> products = Arrays.asList(activeProduct);
        List<LandListing> lands = Arrays.asList(availableLand);

        Page<Product> productPage = new PageImpl<>(products);
        Page<LandListing> landPage = new PageImpl<>(lands);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findBySellerIdAndDeletedAtIsNull(eq(10L), any(Pageable.class))).thenReturn(productPage);
        when(landListingRepository.findBySellerId(eq(10L), any(Pageable.class))).thenReturn(landPage);

        SellerInventoryStatsDTO stats = sellerListingService.getSellerInventoryStats(1L);

        assertNotNull(stats);
        assertEquals(2L, stats.getTotalListings());
        assertEquals(2L, stats.getActiveListings());
        assertEquals(0L, stats.getInactiveListings());
        assertEquals(0L, stats.getLowStockListings());
        assertEquals(0L, stats.getOutOfStockListings());

        verify(sellerProfileRepository).findByUserId(1L);
        verify(productRepository).findBySellerIdAndDeletedAtIsNull(eq(10L), any(Pageable.class));
        verify(landListingRepository).findBySellerId(eq(10L), any(Pageable.class));
    }

    @Test
    public void testToggleProductStatus_Success() {
        when(productRepository.findById(200L)).thenReturn(Optional.of(activeProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductDTO result = sellerListingService.toggleProductStatus(200L, "INACTIVE", 1L);

        assertNotNull(result);
        assertEquals("INACTIVE", result.getProductStatus());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void testToggleProductStatus_AccessDenied() {
        when(productRepository.findById(200L)).thenReturn(Optional.of(activeProduct));

        assertThrows(AccessDeniedException.class, () -> {
            sellerListingService.toggleProductStatus(200L, "INACTIVE", 2L); // otherUser
        });

        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    public void testToggleProductStatus_InvalidStatus() {
        when(productRepository.findById(200L)).thenReturn(Optional.of(activeProduct));

        assertThrows(BadRequestException.class, () -> {
            sellerListingService.toggleProductStatus(200L, "INVALID_STATUS", 1L);
        });

        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    public void testUpdateProductStock_Success() {
        when(productRepository.findById(200L)).thenReturn(Optional.of(activeProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductDTO result = sellerListingService.updateProductStock(200L, 150, 15, 1L);

        assertNotNull(result);
        assertNotNull(result.getInventory());
        assertEquals(150, result.getInventory().getQuantityAvailable());
        assertEquals(15, result.getInventory().getReorderLevel());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void testBulkUpdateStatus_Success() {
        Product anotherProduct = new Product();
        anotherProduct.setId(201L);
        anotherProduct.setProductName("Organic Rice");
        anotherProduct.setSku("RICE-001");
        anotherProduct.setPrice(BigDecimal.valueOf(60));
        anotherProduct.setCategory(category);
        anotherProduct.setSeller(sellerProfile);
        anotherProduct.setProductStatus(Product.ProductStatus.ACTIVE);

        when(productRepository.findById(200L)).thenReturn(Optional.of(activeProduct));
        when(productRepository.findById(201L)).thenReturn(Optional.of(anotherProduct));

        sellerListingService.bulkUpdateStatus(Arrays.asList(200L, 201L), "INACTIVE", 1L);

        assertEquals(Product.ProductStatus.INACTIVE, activeProduct.getProductStatus());
        assertEquals(Product.ProductStatus.INACTIVE, anotherProduct.getProductStatus());
        verify(productRepository, times(2)).save(any(Product.class));
        verify(auditLogRepository, times(2)).save(any(AuditLog.class));
    }

    @Test
    public void testBulkUpdateStock_Success() {
        Product anotherProduct = new Product();
        anotherProduct.setId(201L);
        anotherProduct.setProductName("Organic Rice");
        anotherProduct.setSku("RICE-001");
        anotherProduct.setPrice(BigDecimal.valueOf(60));
        anotherProduct.setCategory(category);
        anotherProduct.setSeller(sellerProfile);
        anotherProduct.setProductStatus(Product.ProductStatus.ACTIVE);

        ProductInventory inventory2 = new ProductInventory();
        inventory2.setId(501L);
        inventory2.setQuantityAvailable(80);
        inventory2.setQuantityReserved(5);
        inventory2.setReorderLevel(10);
        inventory2.setProduct(anotherProduct);
        anotherProduct.setInventory(inventory2);

        when(productRepository.findById(200L)).thenReturn(Optional.of(activeProduct));
        when(productRepository.findById(201L)).thenReturn(Optional.of(anotherProduct));

        sellerListingService.bulkUpdateStock(Arrays.asList(200L, 201L), 300, 1L);

        assertEquals(300, activeProduct.getInventory().getQuantityAvailable());
        assertEquals(300, anotherProduct.getInventory().getQuantityAvailable());
        verify(productRepository, times(2)).save(any(Product.class));
        verify(auditLogRepository, times(2)).save(any(AuditLog.class));
    }

    @Test
    public void testToggleLandStatus_Success() {
        when(landListingRepository.findById(300L)).thenReturn(Optional.of(availableLand));
        when(landListingRepository.save(any(LandListing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LandListingDTO result = sellerListingService.toggleLandStatus(300L, "DELISTED", 1L);

        assertNotNull(result);
        assertEquals("DELISTED", result.getLandStatus());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    public void testBulkUpdateLandStatus_Success() {
        LandListing anotherLand = new LandListing();
        anotherLand.setId(301L);
        anotherLand.setLandTitle("Second Field");
        anotherLand.setAreaInAcres(BigDecimal.valueOf(10));
        anotherLand.setLandType("Agricultural");
        anotherLand.setPricePerAcre(BigDecimal.valueOf(150000));
        anotherLand.setState("Maharashtra");
        anotherLand.setDistrict("Pune");
        anotherLand.setTaluka("Mulshi");
        anotherLand.setPinCode("412115");
        anotherLand.setLatitude(BigDecimal.valueOf(18.5204));
        anotherLand.setLongitude(BigDecimal.valueOf(73.8567));
        anotherLand.setSeller(sellerProfile);
        anotherLand.setLandStatus(LandListing.LandStatus.AVAILABLE);

        when(landListingRepository.findById(300L)).thenReturn(Optional.of(availableLand));
        when(landListingRepository.findById(301L)).thenReturn(Optional.of(anotherLand));

        sellerListingService.bulkUpdateLandStatus(Arrays.asList(300L, 301L), "SOLD", 1L);

        assertEquals(LandListing.LandStatus.SOLD, availableLand.getLandStatus());
        assertEquals(LandListing.LandStatus.SOLD, anotherLand.getLandStatus());
        verify(landListingRepository, times(2)).save(any(LandListing.class));
        verify(auditLogRepository, times(2)).save(any(AuditLog.class));
    }
}
