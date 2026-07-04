package com.smartkrishi.service.admin;

import com.smartkrishi.dto.admin.AdminDashboardStatsDTO;
import com.smartkrishi.dto.admin.FraudAlertDTO;
import com.smartkrishi.entity.Category;
import com.smartkrishi.entity.Order;
import com.smartkrishi.entity.Product;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.repository.OrderRepository;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.repository.SellerProfileRepository;
import com.smartkrishi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminDashboardTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private com.smartkrishi.repository.FeedbackRepository feedbackRepository;

    @Mock
    private com.smartkrishi.repository.ReviewRepository reviewRepository;

    @InjectMocks
    private AdminAnalyticsServiceImpl adminAnalyticsService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAdminDashboardStats() {
        // Mock counts
        when(userRepository.count()).thenReturn(150L);
        when(sellerProfileRepository.count()).thenReturn(20L);
        when(sellerProfileRepository.countBySellerStatus(SellerProfile.SellerStatus.PENDING)).thenReturn(5L);
        when(productRepository.count()).thenReturn(200L);
        when(productRepository.countByProductStatus(Product.ProductStatus.ACTIVE)).thenReturn(180L);
        when(feedbackRepository.count()).thenReturn(10L);
        when(feedbackRepository.countByStatus(com.smartkrishi.entity.Feedback.FeedbackStatus.PENDING)).thenReturn(3L);
        when(feedbackRepository.countByCategoryGrouped()).thenReturn(Collections.emptyList());
        when(feedbackRepository.countByStatusGrouped()).thenReturn(Collections.emptyList());
        when(feedbackRepository.countByPriorityGrouped()).thenReturn(Collections.emptyList());
        when(sellerProfileRepository.findAll()).thenReturn(Collections.emptyList());

        // Mock orders
        Order o1 = new Order();
        o1.setId(1L);
        o1.setOrderNumber("ORD100");
        o1.setTotalAmount(BigDecimal.valueOf(1000));
        o1.setPlatformFee(BigDecimal.valueOf(35));
        o1.setOrderStatus(Order.OrderStatus.DELIVERED);
        o1.setCreatedAt(LocalDateTime.now());

        Order o2 = new Order();
        o2.setId(2L);
        o2.setOrderNumber("ORD200");
        o2.setTotalAmount(BigDecimal.valueOf(60000)); // Will trigger High Value fraud warning too
        o2.setPlatformFee(BigDecimal.valueOf(1500));
        o2.setOrderStatus(Order.OrderStatus.PENDING);
        o2.setCreatedAt(LocalDateTime.now());

        when(orderRepository.findAll()).thenReturn(Arrays.asList(o1, o2));

        // Mock product categories
        Category cat = new Category();
        cat.setCategoryName("Crops");
        Product p = new Product();
        p.setCategory(cat);
        p.setPrice(BigDecimal.valueOf(100));
        p.setProductStatus(Product.ProductStatus.ACTIVE);
        when(productRepository.findAll()).thenReturn(Collections.singletonList(p));

        AdminDashboardStatsDTO stats = adminAnalyticsService.getAdminDashboardStats();

        assertNotNull(stats);
        assertEquals(150L, stats.getTotalUsers());
        assertEquals(20L, stats.getTotalSellers());
        assertEquals(5L, stats.getPendingSellers());
        assertEquals(200L, stats.getTotalProducts());
        assertEquals(180L, stats.getActiveProducts());
        assertEquals(2L, stats.getTotalOrders());
        assertEquals(0, BigDecimal.valueOf(61000).compareTo(stats.getTotalRevenue()));
        assertEquals(0, BigDecimal.valueOf(1535).compareTo(stats.getTotalCommission()));
        assertEquals(1, stats.getActiveFraudAlerts()); // o2 is > 50000
    }

    @Test
    void testGetFraudAlerts() {
        // High Value Order Mock
        Order o1 = new Order();
        o1.setId(1L);
        o1.setOrderNumber("ORD-FRAUD-1");
        o1.setTotalAmount(BigDecimal.valueOf(75000));
        o1.setOrderStatus(Order.OrderStatus.DELIVERED);
        o1.setCreatedAt(LocalDateTime.now());
        when(orderRepository.findAll()).thenReturn(Collections.singletonList(o1));

        // Pricing Anomalies Mock
        Product p1 = new Product();
        p1.setProductName("Free Seed");
        p1.setPrice(BigDecimal.ZERO);
        p1.setCreatedAt(LocalDateTime.now());

        Product p2 = new Product();
        p2.setProductName("Too Cheap Equipment");
        p2.setPrice(BigDecimal.valueOf(5000));
        p2.setDiscountPercentage(BigDecimal.valueOf(95)); // > 90% discount
        p2.setCreatedAt(LocalDateTime.now());

        when(productRepository.findAll()).thenReturn(Arrays.asList(p1, p2));

        List<FraudAlertDTO> alerts = adminAnalyticsService.getFraudAlerts();

        assertNotNull(alerts);
        assertEquals(3, alerts.size()); // 1 High Value Order, 2 Price Anomalies

        FraudAlertDTO a1 = alerts.stream().filter(a -> a.getType().equals("High Value Order")).findFirst().orElse(null);
        assertNotNull(a1);
        assertEquals("HIGH", a1.getSeverity());

        FraudAlertDTO a2 = alerts.stream().filter(a -> a.getDetail().contains("invalid price")).findFirst().orElse(null);
        assertNotNull(a2);
        assertEquals("CRITICAL", a2.getSeverity());

        FraudAlertDTO a3 = alerts.stream().filter(a -> a.getDetail().contains("extreme discount")).findFirst().orElse(null);
        assertNotNull(a3);
        assertEquals("HIGH", a3.getSeverity());
    }
}
