package com.smartkrishi.repository;

import com.smartkrishi.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    Page<Review> findByProductId(Long productId, Pageable pageable);
    
    Page<Review> findByBuyerId(Long buyerId, Pageable pageable);
    
    Optional<Review> findByProductIdAndBuyerId(Long productId, Long buyerId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Integer findReviewCountByProductId(@Param("productId") Long productId);
    
    Page<Review> findByProductIdAndIsApprovedTrue(Long productId, Pageable pageable);
    
    java.util.List<Review> findByProductIdAndIsApprovedTrue(Long productId);

    Page<Review> findBySellerIdAndIsApprovedTrue(Long sellerId, Pageable pageable);
    
    java.util.List<Review> findBySellerIdAndIsApprovedTrue(Long sellerId);

    Page<Review> findByIsApproved(Boolean isApproved, Pageable pageable);
    
    boolean existsByProductIdAndBuyerId(Long productId, Long buyerId);
    
    boolean existsBySellerIdAndBuyerId(Long sellerId, Long buyerId);

    boolean existsByBuyerIdAndCreatedAtAfter(Long buyerId, java.time.LocalDateTime time);
    
    boolean existsByProductIdAndBuyerIdAndOrderItemId(Long productId, Long buyerId, Long orderItemId);
}
