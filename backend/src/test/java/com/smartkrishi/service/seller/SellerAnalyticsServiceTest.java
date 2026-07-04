package com.smartkrishi.service.seller;

import com.smartkrishi.dto.seller.SellerAnalyticsDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.OrderRepository;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.repository.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SellerAnalyticsServiceTest {

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private com.smartkrishi.repository.ReviewRepository reviewRepository;

    @InjectMocks
    private SellerAnalyticsServiceImpl sellerAnalyticsService;

    private SellerProfile sellerProfile;
    private User sellerUser;
    private User buyer1;
    private User buyer2;
    private Product product1;
    private Product product2;
    private Order order1;
    private Order order2;
    private Order order3;

    @BeforeEach
    public void setUp() {
        sellerUser = new User();
        sellerUser.setId(1L);
        sellerUser.setEmail("seller@test.com");

        sellerProfile = new SellerProfile();
        sellerProfile.setId(10L);
        sellerProfile.setUser(sellerUser);
        sellerProfile.setBusinessName("Organic Seeds Co");

        buyer1 = new User();
        buyer1.setId(101L);
        buyer1.setEmail("buyer1@test.com");

        buyer2 = new User();
        buyer2.setId(102L);
        buyer2.setEmail("buyer2@test.com");

        product1 = new Product();
        product1.setId(201L);
        product1.setProductName("Organic Urea");
        product1.setPrice(BigDecimal.valueOf(500.0));
        product1.setViewCount(100);
        product1.setPurchaseCount(5);
        product1.setProductStatus(Product.ProductStatus.ACTIVE);
        ProductInventory inv1 = new ProductInventory();
        inv1.setQuantityAvailable(50);
        inv1.setReorderLevel(10);
        product1.setInventory(inv1);

        product2 = new Product();
        product2.setId(202L);
        product2.setProductName("Wheat Cultivator");
        product2.setPrice(BigDecimal.valueOf(1200.0));
        product2.setViewCount(50);
        product2.setPurchaseCount(0);
        product2.setProductStatus(Product.ProductStatus.DRAFT);
        ProductInventory inv2 = new ProductInventory();
        inv2.setQuantityAvailable(5);
        inv2.setReorderLevel(10); // low stock
        product2.setInventory(inv2);

        order1 = new Order();
        order1.setId(501L);
        order1.setOrderNumber("ORD-101");
        order1.setBuyer(buyer1);
        order1.setOrderStatus(Order.OrderStatus.DELIVERED);
        order1.setTotalAmount(BigDecimal.valueOf(500.0));
        order1.setSellerAmount(BigDecimal.valueOf(480.0)); // after fees
        order1.setCreatedAt(LocalDateTime.now().minusDays(5));

        order2 = new Order();
        order2.setId(502L);
        order2.setOrderNumber("ORD-102");
        order2.setBuyer(buyer1); // repeat buyer
        order2.setOrderStatus(Order.OrderStatus.PENDING);
        order2.setTotalAmount(BigDecimal.valueOf(1000.0));
        order2.setSellerAmount(BigDecimal.valueOf(960.0));
        order2.setCreatedAt(LocalDateTime.now().minusDays(2));

        order3 = new Order();
        order3.setId(503L);
        order3.setOrderNumber("ORD-103");
        order3.setBuyer(buyer2);
        order3.setOrderStatus(Order.OrderStatus.CANCELLED); // cancelled should be ignored in revenue
        order3.setTotalAmount(BigDecimal.valueOf(2500.0));
        order3.setSellerAmount(BigDecimal.valueOf(2400.0));
        order3.setCreatedAt(LocalDateTime.now());
    }

    @Test
    public void testGetSellerAnalytics_Success() {
        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findBySellerIdAndDeletedAtIsNull(10L)).thenReturn(Arrays.asList(product1, product2));
        when(orderRepository.findBySellerId(10L)).thenReturn(Arrays.asList(order1, order2, order3));
        when(reviewRepository.findBySellerIdAndIsApprovedTrue(10L)).thenReturn(Collections.emptyList());

        SellerAnalyticsDTO result = sellerAnalyticsService.getSellerAnalytics(1L);

        assertNotNull(result);
        // Revenue check (order1 + order2, ignoring order3 because CANCELLED)
        assertEquals(BigDecimal.valueOf(1500.0), result.getTotalRevenue());
        assertEquals(BigDecimal.valueOf(1440.0), result.getNetRevenue());
        
        // Orders metrics
        assertEquals(3, result.getTotalOrders());
        assertEquals(1, result.getPendingOrders()); // order2 is PENDING
        assertEquals(1, result.getDeliveredOrders()); // order1 is DELIVERED
        assertEquals(1, result.getCancelledOrders()); // order3 is CANCELLED
        
        // Repeat Customers (buyer1 has 2 orders, buyer2 has 1 order. Total customers = 2. Repeat customers = 1)
        assertEquals(2, result.getTotalCustomers());
        assertEquals(1, result.getRepeatCustomers());
        assertEquals(50.0, result.getRepeatCustomerRate());
        
        // Conversion Rates (total purchases = 5 + 0 = 5, total views = 100 + 50 = 150. rate = 5/150 * 100)
        assertEquals(150L, result.getTotalViews());
        assertEquals(5L, result.getTotalPurchases());
        assertEquals((5.0 / 150.0) * 100.0, result.getConversionRate(), 0.001);
        
        // Inventory Health
        assertEquals(2, result.getTotalProducts());
        assertEquals(1, result.getActiveProducts()); // product1 is ACTIVE, product2 is DRAFT
        assertEquals(0, result.getOutOfStockProducts()); // quantities are 50 and 5
        assertEquals(1, result.getLowStockProducts()); // product2 quantity (5) <= reorder level (10)

        // Top products list
        assertEquals(1, result.getTopProducts().size()); // only product1 has purchaseCount > 0
        assertEquals("Organic Urea", result.getTopProducts().get(0).getProductName());
        
        // Chart lists
        assertEquals(30, result.getDailyChart().size());
        assertEquals(12, result.getWeeklyChart().size());
        assertEquals(12, result.getMonthlyChart().size());
        assertEquals(5, result.getYearlyChart().size());
    }

    @Test
    public void testGetSellerAnalytics_ProfileNotFound() {
        when(sellerProfileRepository.findByUserId(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            sellerAnalyticsService.getSellerAnalytics(99L);
        });
    }
}
