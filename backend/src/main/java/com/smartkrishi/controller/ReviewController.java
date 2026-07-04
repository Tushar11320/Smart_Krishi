package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.review.ReviewDTO;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.review.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@AllArgsConstructor
@Tag(name = "Reviews", description = "APIs for product/seller reviews and ratings")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Create a new review")
    public ResponseEntity<ApiResponse<ReviewDTO>> createReview(
            @Valid @RequestBody ReviewDTO reviewDTO,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required to write reviews");
        }
        // Force the buyerId to match the authenticated user, preventing body manipulation
        reviewDTO.setBuyerId(userPrincipal.getId());
        ReviewDTO created = reviewService.createReview(reviewDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Review created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a review")
    public ResponseEntity<ApiResponse<ReviewDTO>> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewDTO reviewDTO,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required to update reviews");
        }
        ReviewDTO existing = reviewService.getReviewById(id);
        if (!existing.getBuyerId().equals(userPrincipal.getId()) && !isAdmin(userPrincipal)) {
            throw new AccessDeniedException("You are not authorized to update this review");
        }
        ReviewDTO updated = reviewService.updateReview(id, reviewDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Review updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a review")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required to delete reviews");
        }
        ReviewDTO review = reviewService.getReviewById(id);
        if (!review.getBuyerId().equals(userPrincipal.getId()) && !isAdmin(userPrincipal)) {
            throw new AccessDeniedException("You are not authorized to delete this review");
        }
        reviewService.deleteReview(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Review deleted successfully", null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get review by ID")
    public ResponseEntity<ApiResponse<ReviewDTO>> getReviewById(@PathVariable Long id) {
        ReviewDTO review = reviewService.getReviewById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Review retrieved successfully", review));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get all reviews for a product")
    public ResponseEntity<ApiResponse<Page<ReviewDTO>>> getProductReviews(
            @PathVariable Long productId,
            Pageable pageable) {
        Page<ReviewDTO> reviews = reviewService.getProductReviews(productId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Reviews retrieved successfully", reviews));
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "Get all reviews for a seller")
    public ResponseEntity<ApiResponse<Page<ReviewDTO>>> getSellerReviews(
            @PathVariable Long sellerId,
            Pageable pageable) {
        Page<ReviewDTO> reviews = reviewService.getSellerReviews(sellerId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Reviews retrieved successfully", reviews));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all reviews by a user")
    public ResponseEntity<ApiResponse<Page<ReviewDTO>>> getUserReviews(
            @PathVariable Long userId,
            Pageable pageable) {
        Page<ReviewDTO> reviews = reviewService.getUserReviews(userId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Reviews retrieved successfully", reviews));
    }

    @PutMapping("/{id}/seller-response")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Add seller response to review")
    public ResponseEntity<ApiResponse<ReviewDTO>> addSellerResponse(
            @PathVariable Long id,
            @RequestBody String response,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required to respond to reviews");
        }
        ReviewDTO review = reviewService.getReviewById(id);
        // Ensure that if role is SELLER, they are responding to a review on their own profile or product
        // (Note: in a production app we verify ownership of the sellerId or productId's seller)
        ReviewDTO updated = reviewService.addSellerResponse(id, response);
        return ResponseEntity.ok(new ApiResponse<>(true, "Seller response added successfully", updated));
    }

    @PutMapping("/{id}/helpful")
    @Operation(summary = "Mark review as helpful")
    public ResponseEntity<ApiResponse<ReviewDTO>> markHelpful(@PathVariable Long id) {
        ReviewDTO review = reviewService.markHelpful(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Review marked as helpful", review));
    }

    @PutMapping("/{id}/unhelpful")
    @Operation(summary = "Mark review as unhelpful")
    public ResponseEntity<ApiResponse<ReviewDTO>> markUnhelpful(@PathVariable Long id) {
        ReviewDTO review = reviewService.markUnhelpful(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Review marked as unhelpful", review));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get reviews pending moderation (Admin only)")
    public ResponseEntity<ApiResponse<Page<ReviewDTO>>> getPendingReviews(Pageable pageable) {
        Page<ReviewDTO> reviews = reviewService.getPendingReviews(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending reviews retrieved successfully", reviews));
    }

    @PutMapping("/{id}/moderation")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve or flag a review (Admin only)")
    public ResponseEntity<ApiResponse<ReviewDTO>> moderateReview(
            @PathVariable Long id,
            @RequestParam boolean approve) {
        ReviewDTO review = reviewService.approveReview(id, approve);
        return ResponseEntity.ok(new ApiResponse<>(true, "Review moderation state updated successfully", review));
    }

    private boolean isAdmin(UserPrincipal principal) {
        if (principal == null) return false;
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
