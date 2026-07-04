package com.smartkrishi.service;

import com.smartkrishi.dto.product.ProductDTO;
import com.smartkrishi.dto.cart.CartDTO;
import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.controller.CartController;
import com.smartkrishi.service.cart.CartService;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.product.ProductServiceImpl;
import com.smartkrishi.service.payment.PaymentServiceImpl;
import com.smartkrishi.service.review.ReviewServiceImpl;
import org.springframework.http.ResponseEntity;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityBOLAIntegrationTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CartService cartService;

    @InjectMocks
    private ProductServiceImpl productService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    @InjectMocks
    private CartController cartController;

    private UserPrincipal ownerPrincipal;
    private UserPrincipal intruderPrincipal;
    private SellerProfile ownerSeller;
    private SellerProfile intruderSeller;
    private Product product;
    private Payment payment;
    private Review review;

    @BeforeEach
    public void setUp() {
        // Setup user contexts using concrete UserPrincipal instances
        List<GrantedAuthority> ownerAuthorities = new ArrayList<>();
        ownerAuthorities.add(new SimpleGrantedAuthority("ROLE_SELLER"));
        ownerPrincipal = new UserPrincipal(1L, "owner@example.com", "owner@example.com", "pwd", ownerAuthorities);

        List<GrantedAuthority> intruderAuthorities = new ArrayList<>();
        intruderAuthorities.add(new SimpleGrantedAuthority("ROLE_SELLER"));
        intruderPrincipal = new UserPrincipal(2L, "intruder@example.com", "intruder@example.com", "pwd", intruderAuthorities);

        // Setup sellers
        ownerSeller = new SellerProfile();
        ownerSeller.setId(10L);
        ownerSeller.setBusinessName("Owner Shop");

        intruderSeller = new SellerProfile();
        intruderSeller.setId(20L);
        intruderSeller.setBusinessName("Intruder Shop");

        // Setup product
        product = new Product();
        product.setId(100L);
        product.setProductName("Apples");
        product.setSeller(ownerSeller);

        // Setup payment
        User buyer = new User();
        buyer.setId(30L);
        payment = new Payment();
        payment.setId(200L);
        payment.setBuyer(buyer);
        payment.setPaymentStatus(Payment.PaymentStatus.INITIATED);

        // Setup review
        review = new Review();
        review.setId(300L);
        review.setSeller(ownerSeller);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testProductUpdate_BOLA_Violation() {
        // Intruder seller attempts to update Owner seller's product
        Authentication auth = new UsernamePasswordAuthenticationToken(intruderPrincipal, null, intruderPrincipal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(sellerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(intruderSeller));

        ProductDTO dto = ProductDTO.builder().build();

        assertThrows(AccessDeniedException.class, () -> {
            productService.updateProduct(100L, dto);
        });
    }

    @Test
    public void testProductDelete_BOLA_Violation() {
        // Intruder seller attempts to delete Owner seller's product
        Authentication auth = new UsernamePasswordAuthenticationToken(intruderPrincipal, null, intruderPrincipal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(sellerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(intruderSeller));

        assertThrows(AccessDeniedException.class, () -> {
            productService.deleteProduct(100L);
        });
    }

    @Test
    public void testPaymentVerify_BOLA_Violation() {
        // Intruder attempts to verify someone else's payment
        Authentication auth = new UsernamePasswordAuthenticationToken(intruderPrincipal, null, intruderPrincipal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(paymentRepository.findById(200L)).thenReturn(Optional.of(payment));

        assertThrows(AccessDeniedException.class, () -> {
            paymentService.verifyPayment(200L, "mock_txn", "mock_sig");
        });
    }

    @Test
    public void testReviewResponse_BOLA_Violation() {
        // Intruder seller attempts to respond to Owner seller's review
        Authentication auth = new UsernamePasswordAuthenticationToken(intruderPrincipal, null, intruderPrincipal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(reviewRepository.findById(300L)).thenReturn(Optional.of(review));
        when(sellerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(intruderSeller));

        assertThrows(AccessDeniedException.class, () -> {
            reviewService.addSellerResponse(300L, "Thank you!");
        });
    }

    @Test
    public void testProductUpdate_BOLA_Success() {
        // Owner seller successfully updates own product
        Authentication auth = new UsernamePasswordAuthenticationToken(ownerPrincipal, null, ownerPrincipal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(ownerSeller));
        
        Category category = new Category();
        category.setId(5L);
        product.setCategory(category);
        
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductDTO dto = ProductDTO.builder()
                .productName("Apples")
                .categoryId(5L)
                .build();

        ProductDTO result = productService.updateProduct(100L, dto);
        assertNotNull(result);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    public void testCartGet_BOLA_Violation() {
        // Intruder principal attempts to access Owner principal's cart (id 1)
        assertThrows(AccessDeniedException.class, () -> {
            cartController.getCart(1L, intruderPrincipal);
        });
    }

    @Test
    public void testCartGet_BOLA_Success() {
        // Owner principal successfully accesses own cart (id 1)
        CartDTO mockCart = new CartDTO();
        when(cartService.getCart(1L)).thenReturn(mockCart);

        ResponseEntity<ApiResponse<CartDTO>> response = cartController.getCart(1L, ownerPrincipal);
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().getSuccess());
        verify(cartService).getCart(1L);
    }
}
