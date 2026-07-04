package com.smartkrishi.service.review;

import com.smartkrishi.dto.review.ReviewDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public ReviewDTO createReview(ReviewDTO reviewDTO) {
        User user = userRepository.findById(reviewDTO.getBuyerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reviewDTO.getBuyerId()));

        // Spam Protection: rate-limit submissions (maximum 1 per 30 seconds)
        LocalDateTime thirtySecondsAgo = LocalDateTime.now().minusSeconds(30);
        if (reviewRepository.existsByBuyerIdAndCreatedAtAfter(user.getId(), thirtySecondsAgo)) {
            throw new BadRequestException("Please wait 30 seconds between submitting reviews.");
        }

        // Spam Protection: validate title and text for spam keywords, links, phone numbers, or email addresses
        checkForSpam(reviewDTO.getReviewTitle(), reviewDTO.getReviewText());

        // Validate rating ranges
        if (reviewDTO.getRating() == null || reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
            throw new BadRequestException("Rating is required and must be between 1 and 5 stars.");
        }

        Review review = new Review();
        review.setBuyer(user);
        review.setRating(reviewDTO.getRating());
        review.setReviewTitle(reviewDTO.getReviewTitle());
        review.setReviewText(reviewDTO.getReviewText());
        review.setReviewImage(reviewDTO.getReviewImage());
        review.setMediaUrls(reviewDTO.getMediaUrls());
        review.setDeliveryExperience(reviewDTO.getDeliveryExperience());
        review.setProductQualityRating(reviewDTO.getProductQualityRating());
        review.setCommunicationRating(reviewDTO.getCommunicationRating());
        review.setIsVerifiedPurchase(true);
        review.setIsApproved(true); // Auto-approve by default, admins can moderate

        if (reviewDTO.getProductId() != null) {
            Product product = productRepository.findById(reviewDTO.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", reviewDTO.getProductId()));

            OrderItem selectedItem = null;
            if (reviewDTO.getOrderItemId() != null) {
                OrderItem item = orderItemRepository.findById(reviewDTO.getOrderItemId())
                        .orElseThrow(() -> new ResourceNotFoundException("OrderItem", "id", reviewDTO.getOrderItemId()));
                if (!item.getOrder().getBuyer().getId().equals(user.getId())) {
                    throw new BadRequestException("Order item does not belong to you.");
                }
                if (!item.getProduct().getId().equals(product.getId())) {
                    throw new BadRequestException("Order item is not for this product.");
                }
                if (item.getOrder().getOrderStatus() != Order.OrderStatus.DELIVERED) {
                    throw new BadRequestException("You can only review items that have been delivered.");
                }
                if (reviewRepository.existsByProductIdAndBuyerIdAndOrderItemId(product.getId(), user.getId(), item.getId())) {
                    throw new BadRequestException("You have already reviewed this purchase.");
                }
                selectedItem = item;
            } else {
                // Find delivered order items for this product
                List<OrderItem> items = orderItemRepository.findByOrderBuyerIdAndProductIdAndOrderOrderStatus(
                        user.getId(), product.getId(), Order.OrderStatus.DELIVERED);
                if (items.isEmpty()) {
                    throw new BadRequestException("Only buyers who have purchased this product can review it.");
                }
                // Find one not reviewed yet
                for (OrderItem item : items) {
                    if (!reviewRepository.existsByProductIdAndBuyerIdAndOrderItemId(product.getId(), user.getId(), item.getId())) {
                        selectedItem = item;
                        break;
                    }
                }
                if (selectedItem == null) {
                    throw new BadRequestException("You have already reviewed all purchases of this product.");
                }
            }

            review.setProduct(product);
            review.setOrderItem(selectedItem);
            if (product.getSeller() != null) {
                review.setSeller(product.getSeller());
            }

            Review saved = reviewRepository.save(review);
            updateProductRating(product);
            if (review.getSeller() != null) {
                updateSellerRating(review.getSeller());
            }

            log.info("Created review for product {} by user {}", product.getId(), user.getId());
            return mapToDTO(saved);

        } else if (reviewDTO.getSellerId() != null) {
            SellerProfile seller = sellerProfileRepository.findById(reviewDTO.getSellerId())
                    .orElseThrow(() -> new ResourceNotFoundException("SellerProfile", "id", reviewDTO.getSellerId()));

            // Duplicate prevention
            if (reviewRepository.existsBySellerIdAndBuyerId(seller.getId(), user.getId())) {
                throw new BadRequestException("You have already reviewed this seller.");
            }

            // Purchase Check: Only buyers who purchased from this seller in a delivered order can review
            boolean hasPurchased = orderRepository.existsByBuyerIdAndSellerIdAndOrderStatus(
                    user.getId(), seller.getId(), Order.OrderStatus.DELIVERED);
            if (!hasPurchased) {
                throw new BadRequestException("Only buyers who have purchased from this seller can review them.");
            }

            review.setSeller(seller);

            Review saved = reviewRepository.save(review);
            updateSellerRating(seller);

            log.info("Created review for seller {} by user {}", seller.getId(), user.getId());
            return mapToDTO(saved);

        } else {
            throw new BadRequestException("Review must be associated with either a product or a seller.");
        }
    }

    @Override
    @Transactional
    public ReviewDTO updateReview(Long id, ReviewDTO reviewDTO) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));

        checkForSpam(reviewDTO.getReviewTitle(), reviewDTO.getReviewText());

        if (reviewDTO.getRating() == null || reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
            throw new BadRequestException("Rating must be between 1 and 5 stars.");
        }

        review.setRating(reviewDTO.getRating());
        review.setReviewTitle(reviewDTO.getReviewTitle());
        review.setReviewText(reviewDTO.getReviewText());
        review.setReviewImage(reviewDTO.getReviewImage());
        review.setMediaUrls(reviewDTO.getMediaUrls());
        review.setDeliveryExperience(reviewDTO.getDeliveryExperience());
        review.setProductQualityRating(reviewDTO.getProductQualityRating());
        review.setCommunicationRating(reviewDTO.getCommunicationRating());

        Review updatedReview = reviewRepository.save(review);

        if (review.getProduct() != null) {
            updateProductRating(review.getProduct());
        }
        if (review.getSeller() != null) {
            updateSellerRating(review.getSeller());
        }

        log.info("Updated review {}", id);
        return mapToDTO(updatedReview);
    }

    @Override
    @Transactional
    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));

        Product product = review.getProduct();
        SellerProfile seller = review.getSeller();

        reviewRepository.delete(review);

        if (product != null) {
            updateProductRating(product);
        }
        if (seller != null) {
            updateSellerRating(seller);
        }

        log.info("Deleted review {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewDTO getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));
        return mapToDTO(review);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewDTO> getProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrue(productId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewDTO> getSellerReviews(Long sellerId, Pageable pageable) {
        return reviewRepository.findBySellerIdAndIsApprovedTrue(sellerId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewDTO> getUserReviews(Long userId, Pageable pageable) {
        return reviewRepository.findByBuyerId(userId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional
    public ReviewDTO addSellerResponse(Long reviewId, String response) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        // Validate BOLA / Ownership
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof com.smartkrishi.security.UserPrincipal)) {
            throw new org.springframework.security.access.AccessDeniedException("User must be authenticated to respond to reviews");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin) {
            SellerProfile seller = sellerProfileRepository.findByUserId(principal.getId())
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Seller profile not found for user ID: " + principal.getId()));
            if (review.getSeller() == null || !review.getSeller().getId().equals(seller.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You are not authorized to respond to this review");
            }
        }

        review.setSellerResponse(response);
        review.setSellerResponseAt(LocalDateTime.now());
        Review updated = reviewRepository.save(review);

        log.info("Added seller response to review {}", reviewId);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public ReviewDTO markHelpful(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        review.setHelpfulCount(review.getHelpfulCount() + 1);
        Review updated = reviewRepository.save(review);

        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public ReviewDTO markUnhelpful(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        review.setUnhelpfulCount(review.getUnhelpfulCount() + 1);
        Review updated = reviewRepository.save(review);

        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public ReviewDTO approveReview(Long id, boolean approve) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));

        review.setIsApproved(approve);
        Review updated = reviewRepository.save(review);

        if (review.getProduct() != null) {
            updateProductRating(review.getProduct());
        }
        if (review.getSeller() != null) {
            updateSellerRating(review.getSeller());
        }

        log.info("Review {} moderation state set to {}", id, approve);
        return mapToDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewDTO> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByIsApproved(false, pageable)
                .map(this::mapToDTO);
    }

    private void updateProductRating(Product product) {
        List<Review> reviews = reviewRepository.findByProductIdAndIsApprovedTrue(product.getId());

        if (reviews.isEmpty()) {
            product.setRating(BigDecimal.ZERO);
            product.setReviewCount(0);
        } else {
            BigDecimal avgRating = BigDecimal.valueOf(
                    reviews.stream()
                            .mapToInt(Review::getRating)
                            .average()
                            .orElse(0.0)
            ).setScale(2, RoundingMode.HALF_UP);

            product.setRating(avgRating);
            product.setReviewCount(reviews.size());
        }

        productRepository.save(product);
    }

    private void updateSellerRating(SellerProfile seller) {
        List<Review> reviews = reviewRepository.findBySellerIdAndIsApprovedTrue(seller.getId());

        if (reviews.isEmpty()) {
            seller.setRating(BigDecimal.ZERO);
            seller.setReviewCount(0);
        } else {
            BigDecimal avgRating = BigDecimal.valueOf(
                    reviews.stream()
                            .mapToInt(Review::getRating)
                            .average()
                            .orElse(0.0)
            ).setScale(2, RoundingMode.HALF_UP);

            seller.setRating(avgRating);
            seller.setReviewCount(reviews.size());
        }

        sellerProfileRepository.save(seller);
    }

    private void checkForSpam(String title, String text) {
        if (title == null) title = "";
        if (text == null) text = "";
        String combined = (title + " " + text).toLowerCase();

        // Check for URLs
        if (combined.contains("http://") || combined.contains("https://") || combined.contains("www.") || combined.contains(".com")) {
            throw new BadRequestException("Reviews cannot contain website links or domains to prevent spam.");
        }

        // Check for email addresses
        if (combined.matches(".*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}.*")) {
            throw new BadRequestException("Reviews cannot contain email addresses to prevent spam.");
        }

        // Check for phone numbers (10-digit number block check)
        if (combined.matches(".*\\b\\d{10}\\b.*") || combined.matches(".*\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b.*")) {
            throw new BadRequestException("Reviews cannot contain phone numbers to prevent spam.");
        }
    }

    private ReviewDTO mapToDTO(Review review) {
        ReviewDTO.ReviewDTOBuilder builder = ReviewDTO.builder()
                .id(review.getId())
                .buyerId(review.getBuyer().getId())
                .buyerName(review.getBuyer().getFirstName() + " " + review.getBuyer().getLastName())
                .rating(review.getRating())
                .reviewTitle(review.getReviewTitle())
                .reviewText(review.getReviewText())
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .helpfulCount(review.getHelpfulCount())
                .unhelpfulCount(review.getUnhelpfulCount())
                .sellerResponse(review.getSellerResponse())
                .sellerResponseDate(review.getSellerResponseAt())
                .isApproved(review.getIsApproved())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .mediaUrls(review.getMediaUrls())
                .deliveryExperience(review.getDeliveryExperience())
                .productQualityRating(review.getProductQualityRating())
                .communicationRating(review.getCommunicationRating());

        if (review.getProduct() != null) {
            builder.productId(review.getProduct().getId())
                   .productName(review.getProduct().getProductName());
        }
        if (review.getOrderItem() != null) {
            builder.orderItemId(review.getOrderItem().getId());
        }
        if (review.getSeller() != null) {
            builder.sellerId(review.getSeller().getId())
                   .sellerName(review.getSeller().getBusinessName());
        }
        builder.reviewImage(review.getReviewImage());

        return builder.build();
    }
}
