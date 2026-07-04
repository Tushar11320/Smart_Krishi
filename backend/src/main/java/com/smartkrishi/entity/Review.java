package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", uniqueConstraints = {
        @UniqueConstraint(name = "uk_review", columnNames = { "product_id", "buyer_id", "order_item_id" }),
        @UniqueConstraint(name = "uk_seller_buyer", columnNames = { "seller_id", "buyer_id" })
}, indexes = {
        @Index(name = "idx_product_id", columnList = "product_id"),
        @Index(name = "idx_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_reviews_product_approved", columnList = "product_id, is_approved, created_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"product", "buyer", "orderItem", "seller"})
@EqualsAndHashCode(exclude = {"product", "buyer", "orderItem", "seller"})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = true)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = true)
    private SellerProfile seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = true)
    private OrderItem orderItem;

    @Column(nullable = false)
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    @NotNull(message = "Rating is required")
    private Integer rating;

    @Column(length = 500)
    private String reviewTitle;

    @Column(columnDefinition = "TEXT")
    private String reviewText;

    @Column(length = 500)
    private String reviewImage;

    @Column(columnDefinition = "TEXT")
    private String mediaUrls;

    @Column(name = "delivery_experience")
    @Min(value = 1, message = "Delivery experience must be between 1 and 5")
    @Max(value = 5, message = "Delivery experience must be between 1 and 5")
    private Integer deliveryExperience;

    @Column(name = "product_quality_rating")
    @Min(value = 1, message = "Product quality rating must be between 1 and 5")
    @Max(value = 5, message = "Product quality rating must be between 1 and 5")
    private Integer productQualityRating;

    @Column(name = "communication_rating")
    @Min(value = 1, message = "Communication rating must be between 1 and 5")
    @Max(value = 5, message = "Communication rating must be between 1 and 5")
    private Integer communicationRating;

    @Column(nullable = false)
    private Boolean isVerifiedPurchase = true;

    @Column(nullable = false)
    private Integer helpfulCount = 0;

    @Column(nullable = false)
    private Integer unhelpfulCount = 0;

    @Column(columnDefinition = "TEXT")
    private String sellerResponse;

    @Column(name = "seller_response_at")
    private LocalDateTime sellerResponseAt;

    @Column(nullable = false)
    private Boolean isApproved = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
