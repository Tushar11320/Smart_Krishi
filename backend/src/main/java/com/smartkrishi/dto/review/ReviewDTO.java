package com.smartkrishi.dto.review;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewDTO {
    
    private Long id;
    
    private Long productId;
    
    private Long orderItemId;
    
    private String productName;
    
    @NotNull(message = "Buyer ID is required")
    private Long buyerId;
    
    private String buyerName;
    
    private Long sellerId;
    
    private String sellerName;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;
    
    @NotBlank(message = "Review title is required")
    private String reviewTitle;
    
    @NotBlank(message = "Review text is required")
    private String reviewText;
    
    private Boolean isVerifiedPurchase;
    
    private Integer helpfulCount;
    
    private Integer unhelpfulCount;
    
    private String sellerResponse;
    
    private LocalDateTime sellerResponseDate;
    
    private Boolean isApproved;
    
    private String reviewImage;
    
    private String mediaUrls;
    
    private Integer deliveryExperience;
    
    private Integer productQualityRating;
    
    private Integer communicationRating;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
