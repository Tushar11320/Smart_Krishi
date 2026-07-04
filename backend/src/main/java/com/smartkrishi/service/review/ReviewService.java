package com.smartkrishi.service.review;

import com.smartkrishi.dto.review.ReviewDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    
    ReviewDTO createReview(ReviewDTO reviewDTO);
    
    ReviewDTO updateReview(Long id, ReviewDTO reviewDTO);
    
    void deleteReview(Long id);
    
    ReviewDTO getReviewById(Long id);
    
    Page<ReviewDTO> getProductReviews(Long productId, Pageable pageable);
    
    Page<ReviewDTO> getSellerReviews(Long sellerId, Pageable pageable);

    Page<ReviewDTO> getUserReviews(Long userId, Pageable pageable);
    
    ReviewDTO addSellerResponse(Long reviewId, String response);
    
    ReviewDTO markHelpful(Long reviewId);
    
    ReviewDTO markUnhelpful(Long reviewId);

    ReviewDTO approveReview(Long id, boolean approve);

    Page<ReviewDTO> getPendingReviews(Pageable pageable);
}
