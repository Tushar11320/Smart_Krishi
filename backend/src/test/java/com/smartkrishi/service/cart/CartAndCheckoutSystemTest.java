package com.smartkrishi.service.cart;

import com.smartkrishi.dto.cart.CartDTO;
import com.smartkrishi.dto.cart.CartItemDTO;
import com.smartkrishi.dto.order.OrderDTO;
import com.smartkrishi.dto.order.OrderItemDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.repository.*;
import com.smartkrishi.service.order.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartAndCheckoutSystemTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User buyer;
    private Product product1;
    private Product product2;
    private Cart cart;
    private CartItem item1;
    private CartItem item2;

    @BeforeEach
    public void setUp() {
        buyer = new User();
        buyer.setId(10L);
        buyer.setEmail("buyer@smartkrishi.com");
        buyer.setFirstName("Rajesh");
        buyer.setLastName("Kumar");

        product1 = new Product();
        product1.setId(101L);
        product1.setProductName("Fresh Apples");
        product1.setPrice(BigDecimal.valueOf(100));
        product1.setProductStatus(Product.ProductStatus.ACTIVE);

        product2 = new Product();
        product2.setId(102L);
        product2.setProductName("Premium Fertilizer");
        product2.setPrice(BigDecimal.valueOf(500));
        product2.setProductStatus(Product.ProductStatus.ACTIVE);

        cart = new Cart();
        cart.setId(50L);
        cart.setBuyer(buyer);

        item1 = new CartItem();
        item1.setId(1L);
        item1.setCart(cart);
        item1.setProduct(product1);
        item1.setQuantity(2);
        item1.setUnitPrice(BigDecimal.valueOf(100));
        item1.setTotalPrice(BigDecimal.valueOf(200));
        item1.setSaveForLater(false);

        item2 = new CartItem();
        item2.setId(2L);
        item2.setCart(cart);
        item2.setProduct(product2);
        item2.setQuantity(1);
        item2.setUnitPrice(BigDecimal.valueOf(500));
        item2.setTotalPrice(BigDecimal.valueOf(500));
        item2.setSaveForLater(false);

        Set<CartItem> cartItems = new HashSet<>(Arrays.asList(item1, item2));
        cart.setCartItems(cartItems);
        cart.setTotalItems(3);
        cart.setTotalPrice(BigDecimal.valueOf(700));
    }

    @Test
    public void testToggleSaveForLater_Save() {
        when(cartRepository.findByBuyerId(10L)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Save item2 for later
        CartDTO result = cartService.toggleSaveForLater(10L, 2L, true);

        assertNotNull(result);
        // Item2 is saved for later, so only item1 remains active (quantity = 2, subtotal = 200)
        assertEquals(2, result.getTotalItems());
        assertEquals(0, BigDecimal.valueOf(200).compareTo(result.getTotalPrice()));

        // Check saveForLater status on DTO items
        CartItemDTO item1DTO = result.getCartItems().stream().filter(i -> i.getId().equals(1L)).findFirst().orElse(null);
        CartItemDTO item2DTO = result.getCartItems().stream().filter(i -> i.getId().equals(2L)).findFirst().orElse(null);

        assertNotNull(item1DTO);
        assertFalse(item1DTO.getSaveForLater());
        assertNotNull(item2DTO);
        assertTrue(item2DTO.getSaveForLater());

        verify(cartRepository).save(cart);
    }

    @Test
    public void testToggleSaveForLater_MoveToCart() {
        // Prepare with item2 saved for later
        item2.setSaveForLater(true);
        cart.setTotalItems(2);
        cart.setTotalPrice(BigDecimal.valueOf(200));

        when(cartRepository.findByBuyerId(10L)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Move item2 back to active cart
        CartDTO result = cartService.toggleSaveForLater(10L, 2L, false);

        assertNotNull(result);
        assertEquals(3, result.getTotalItems());
        assertEquals(0, BigDecimal.valueOf(700).compareTo(result.getTotalPrice()));

        verify(cartRepository).save(cart);
    }

    @Test
    public void testOrderPreviewSecureCalculations() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(buyer));
        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));
        when(productRepository.findById(102L)).thenReturn(Optional.of(product2));

        List<OrderItemDTO> items = Arrays.asList(
                OrderItemDTO.builder().productId(101L).quantity(2).build(), // 2 * 100 = 200
                OrderItemDTO.builder().productId(102L).quantity(1).build()  // 1 * 500 = 500
        );

        OrderDTO orderDTO = OrderDTO.builder()
                .buyerId(10L)
                .shippingAddress("Pune, Maharashtra")
                .orderItems(items)
                .build();

        OrderDTO preview = orderService.previewOrder(orderDTO);

        assertNotNull(preview);
        // Subtotal = 700
        assertEquals(0, BigDecimal.valueOf(700).compareTo(preview.getSubtotalAmount()));
        
        // Platform fee: subtotal is 700 (<= 5000), so feePercent = 3.5% -> 700 * 0.035 = 24.50
        assertEquals(0, BigDecimal.valueOf(24.50).compareTo(preview.getPlatformFee()));

        // GST: 5% of subtotal (700) -> 700 * 0.05 = 35.00
        assertEquals(0, BigDecimal.valueOf(35.00).compareTo(preview.getTaxAmount()));

        // Shipping charges = 350
        assertEquals(0, BigDecimal.valueOf(350).compareTo(preview.getShippingCharge()));

        // Final Amount = Subtotal(700) + Tax(35) + Shipping(350) + PlatformFee(24.50) = 1109.50
        assertEquals(0, BigDecimal.valueOf(1109.50).compareTo(preview.getTotalAmount()));
    }

    @Test
    public void testCreateOrderClearsActiveCartItemsOnly() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(buyer));
        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));
        when(cartRepository.findByBuyerId(10L)).thenReturn(Optional.of(cart));
        
        // Let's mark item2 as saved for later.
        // During checkout, only item1 (active) is ordered.
        item2.setSaveForLater(true);
        cart.setTotalItems(2);
        cart.setTotalPrice(BigDecimal.valueOf(200));

        List<OrderItemDTO> orderedItems = Arrays.asList(
                OrderItemDTO.builder().productId(101L).quantity(2).build()
        );

        OrderDTO orderDTO = OrderDTO.builder()
                .buyerId(10L)
                .shippingAddress("Pune, Maharashtra")
                .orderItems(orderedItems)
                .build();

        // Stub repositories
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(88L);
            order.setOrderNumber("ORD-12345");
            order.setBuyer(buyer);
            return order;
        });

        // Run
        OrderDTO result = orderService.createOrder(orderDTO);

        assertNotNull(result);
        
        // Verify active cart item (item1) is cleared, and saved item (item2) remains in the cart
        assertEquals(1, cart.getCartItems().size());
        assertTrue(cart.getCartItems().stream().anyMatch(item -> item.getId().equals(2L)));
        assertFalse(cart.getCartItems().stream().anyMatch(item -> item.getId().equals(1L)));

        // Cart totals updated for saved item (item2 quantity = 1, total = 500)
        assertEquals(1, cart.getTotalItems());
        assertEquals(0, BigDecimal.valueOf(500).compareTo(cart.getTotalPrice()));

        verify(cartRepository).save(cart);
        verify(orderRepository, atLeastOnce()).save(any(Order.class));
    }
}
