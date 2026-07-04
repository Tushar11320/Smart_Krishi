package com.smartkrishi.service.review;

import com.smartkrishi.dto.review.ReviewDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewSystemTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private SellerProfileRepository sellerProfileRepository;
    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User buyer;
    private SellerProfile seller;
    private Product product;
    private OrderItem orderItem;

    @BeforeEach
    public void setUp() {
        buyer = new User();
        buyer.setId(1L);
        buyer.setFirstName("Raj");
        buyer.setLastName("Kumar");

        seller = new SellerProfile();
        seller.setId(2L);
        seller.setBusinessName("Organic Seeds Co.");
        seller.setRating(BigDecimal.ZERO);
        seller.setReviewCount(0);

        product = new Product();
        product.setId(3L);
        product.setProductName("Organic Fertilizer");
        product.setSeller(seller);
        product.setRating(BigDecimal.ZERO);
        product.setReviewCount(0);

        orderItem = new OrderItem();
        orderItem.setId(4L);
        orderItem.setProduct(product);
    }

    @Test
    public void testCreateReview_Success_ProductReview() {
        ReviewDTO dto = ReviewDTO.builder()
                .buyerId(buyer.getId())
                .productId(product.getId())
                .rating(5)
                .reviewTitle("Great Product")
                .reviewText("It worked wonders on my tomato plants.")
                .build();

        when(userRepository.findById(buyer.getId())).thenReturn(Optional.of(buyer));
        when(reviewRepository.existsByBuyerIdAndCreatedAtAfter(any(), any())).thenReturn(false);
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(reviewRepository.existsByProductIdAndBuyerIdAndOrderItemId(anyLong(), anyLong(), anyLong())).thenReturn(false);
        
        // Mock delivered purchase order item
        when(orderItemRepository.findByOrderBuyerIdAndProductIdAndOrderOrderStatus(
                eq(buyer.getId()), eq(product.getId()), eq(Order.OrderStatus.DELIVERED)))
                .thenReturn(Collections.singletonList(orderItem));

        Review mockSavedReview = new Review();
        mockSavedReview.setId(10L);
        mockSavedReview.setBuyer(buyer);
        mockSavedReview.setProduct(product);
        mockSavedReview.setOrderItem(orderItem);
        mockSavedReview.setSeller(seller);
        mockSavedReview.setRating(5);
        mockSavedReview.setReviewTitle("Great Product");
        mockSavedReview.setReviewText("It worked wonders on my tomato plants.");
        mockSavedReview.setIsVerifiedPurchase(true);
        mockSavedReview.setIsApproved(true);
        mockSavedReview.setHelpfulCount(0);
        mockSavedReview.setUnhelpfulCount(0);

        when(reviewRepository.save(any(Review.class))).thenReturn(mockSavedReview);
        
        // Mock empty reviews to return for rating calculation inside createReview
        when(reviewRepository.findByProductIdAndIsApprovedTrue(product.getId()))
                .thenReturn(Collections.singletonList(mockSavedReview));
        when(reviewRepository.findBySellerIdAndIsApprovedTrue(seller.getId()))
                .thenReturn(Collections.singletonList(mockSavedReview));

        ReviewDTO result = reviewService.createReview(dto);

        assertNotNull(result);
        assertEquals("Great Product", result.getReviewTitle());
        assertEquals(5, result.getRating());
        assertTrue(result.getIsVerifiedPurchase());
        
        // Verify rating sync happened
        verify(productRepository).save(product);
        verify(sellerProfileRepository).save(seller);
        assertEquals(BigDecimal.valueOf(5.00).setScale(2), product.getRating());
        assertEquals(1, product.getReviewCount());
    }

    @Test
    public void testCreateReview_Failure_NotPurchased() {
        ReviewDTO dto = ReviewDTO.builder()
                .buyerId(buyer.getId())
                .productId(product.getId())
                .rating(4)
                .reviewTitle("Okay product")
                .reviewText("It is fine.")
                .build();

        when(userRepository.findById(buyer.getId())).thenReturn(Optional.of(buyer));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        
        // Return empty list indicating no purchase
        when(orderItemRepository.findByOrderBuyerIdAndProductIdAndOrderOrderStatus(
                eq(buyer.getId()), eq(product.getId()), eq(Order.OrderStatus.DELIVERED)))
                .thenReturn(new ArrayList<>());

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            reviewService.createReview(dto);
        });

        assertEquals("Only buyers who have purchased this product can review it.", ex.getMessage());
    }

    @Test
    public void testCreateReview_Failure_Duplicate() {
        ReviewDTO dto = ReviewDTO.builder()
                .buyerId(buyer.getId())
                .productId(product.getId())
                .rating(4)
                .reviewTitle("Great")
                .reviewText("Loved it")
                .build();

        when(userRepository.findById(buyer.getId())).thenReturn(Optional.of(buyer));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        
        // Mock delivered purchase order item
        when(orderItemRepository.findByOrderBuyerIdAndProductIdAndOrderOrderStatus(
                eq(buyer.getId()), eq(product.getId()), eq(Order.OrderStatus.DELIVERED)))
                .thenReturn(Collections.singletonList(orderItem));

        // Mock already reviewed
        when(reviewRepository.existsByProductIdAndBuyerIdAndOrderItemId(product.getId(), buyer.getId(), orderItem.getId())).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            reviewService.createReview(dto);
        });

        assertEquals("You have already reviewed all purchases of this product.", ex.getMessage());
    }

    @Test
    public void testCreateReview_Failure_SpamLink() {
        ReviewDTO dto = ReviewDTO.builder()
                .buyerId(buyer.getId())
                .productId(product.getId())
                .rating(5)
                .reviewTitle("Buy seeds here")
                .reviewText("Get cheap deals at http://spamsite.com")
                .build();

        when(userRepository.findById(buyer.getId())).thenReturn(Optional.of(buyer));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            reviewService.createReview(dto);
        });

        assertTrue(ex.getMessage().contains("website links"));
    }

    @Test
    public void testCreateReview_Failure_RateLimit() {
        ReviewDTO dto = ReviewDTO.builder()
                .buyerId(buyer.getId())
                .productId(product.getId())
                .rating(5)
                .reviewTitle("Nice")
                .reviewText("Good one")
                .build();

        when(userRepository.findById(buyer.getId())).thenReturn(Optional.of(buyer));
        
        // Mock that user reviewed 10 seconds ago
        when(reviewRepository.existsByBuyerIdAndCreatedAtAfter(any(), any())).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            reviewService.createReview(dto);
        });

        assertTrue(ex.getMessage().contains("Please wait 30 seconds"));
    }

    @Test
    public void testCreateReview_Success_SellerReview() {
        ReviewDTO dto = ReviewDTO.builder()
                .buyerId(buyer.getId())
                .sellerId(seller.getId())
                .rating(4)
                .reviewTitle("Excellent Seller")
                .reviewText("Fast responses and great service.")
                .build();

        when(userRepository.findById(buyer.getId())).thenReturn(Optional.of(buyer));
        when(sellerProfileRepository.findById(seller.getId())).thenReturn(Optional.of(seller));
        when(reviewRepository.existsBySellerIdAndBuyerId(seller.getId(), buyer.getId())).thenReturn(false);
        
        // Mock purchase from seller exists
        when(orderRepository.existsByBuyerIdAndSellerIdAndOrderStatus(
                eq(buyer.getId()), eq(seller.getId()), eq(Order.OrderStatus.DELIVERED)))
                .thenReturn(true);

        Review mockSavedReview = new Review();
        mockSavedReview.setId(11L);
        mockSavedReview.setBuyer(buyer);
        mockSavedReview.setSeller(seller);
        mockSavedReview.setRating(4);
        mockSavedReview.setReviewTitle("Excellent Seller");
        mockSavedReview.setReviewText("Fast responses and great service.");
        mockSavedReview.setIsVerifiedPurchase(true);
        mockSavedReview.setIsApproved(true);
        mockSavedReview.setHelpfulCount(0);
        mockSavedReview.setUnhelpfulCount(0);

        when(reviewRepository.save(any(Review.class))).thenReturn(mockSavedReview);
        when(reviewRepository.findBySellerIdAndIsApprovedTrue(seller.getId()))
                .thenReturn(Collections.singletonList(mockSavedReview));

        ReviewDTO result = reviewService.createReview(dto);

        assertNotNull(result);
        assertEquals("Excellent Seller", result.getReviewTitle());
        assertEquals(4, result.getRating());
        
        verify(sellerProfileRepository).save(seller);
        assertEquals(BigDecimal.valueOf(4.00).setScale(2), seller.getRating());
        assertEquals(1, seller.getReviewCount());
    }

    @Test
    public void testApproveReview_AdminModeration() {
        Review mockReview = new Review();
        mockReview.setId(10L);
        mockReview.setBuyer(buyer);
        mockReview.setProduct(product);
        mockReview.setSeller(seller);
        mockReview.setRating(5);
        mockReview.setIsApproved(false); // Initially unapproved

        when(reviewRepository.findById(10L)).thenReturn(Optional.of(mockReview));
        when(reviewRepository.save(any(Review.class))).thenReturn(mockReview);

        // When approved, it should recalculate rating
        when(reviewRepository.findByProductIdAndIsApprovedTrue(product.getId())).thenReturn(Collections.singletonList(mockReview));
        when(reviewRepository.findBySellerIdAndIsApprovedTrue(seller.getId())).thenReturn(Collections.singletonList(mockReview));

        ReviewDTO result = reviewService.approveReview(10L, true);

        assertNotNull(result);
        assertTrue(result.getIsApproved());
        verify(productRepository).save(product);
        verify(sellerProfileRepository).save(seller);
    }
}
