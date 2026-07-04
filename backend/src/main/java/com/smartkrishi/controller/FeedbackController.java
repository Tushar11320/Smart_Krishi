package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.dto.feedback.FeedbackDTO;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.feedback.FeedbackService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@AllArgsConstructor
@Tag(name = "Feedback", description = "APIs for user feedback, bugs, complaints, and suggestions")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @Operation(summary = "Submit new feedback/bug/complaint")
    public ResponseEntity<ApiResponse<FeedbackDTO>> createFeedback(
            @Valid @RequestBody FeedbackDTO feedbackDTO,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required to submit feedback");
        }
        feedbackDTO.setUserId(userPrincipal.getId());
        FeedbackDTO created = feedbackService.createFeedback(feedbackDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Feedback submitted successfully", created), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all feedbacks (Admin only)")
    public ResponseEntity<ApiResponse<Page<FeedbackDTO>>> getFeedbacks(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<FeedbackDTO> page = feedbackService.getFeedbacks(category, status, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Feedbacks retrieved successfully", page));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my submitted feedbacks")
    public ResponseEntity<ApiResponse<Page<FeedbackDTO>>> getMyFeedbacks(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        Page<FeedbackDTO> page = feedbackService.getUserFeedbacks(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Your feedbacks retrieved successfully", page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get feedback details by ID")
    public ResponseEntity<ApiResponse<FeedbackDTO>> getFeedbackById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        FeedbackDTO feedback = feedbackService.getFeedbackById(id);
        if (!feedback.getUserId().equals(userPrincipal.getId()) && !isAdmin(userPrincipal)) {
            throw new AccessDeniedException("You are not authorized to view this feedback");
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Feedback retrieved successfully", feedback));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update feedback status and priority (Admin only)")
    public ResponseEntity<ApiResponse<FeedbackDTO>> updateFeedbackStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        FeedbackDTO updated = feedbackService.updateFeedbackStatus(id, status, priority);
        return ResponseEntity.ok(new ApiResponse<>(true, "Feedback status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete feedback")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        FeedbackDTO feedback = feedbackService.getFeedbackById(id);
        if (!feedback.getUserId().equals(userPrincipal.getId()) && !isAdmin(userPrincipal)) {
            throw new AccessDeniedException("You are not authorized to delete this feedback");
        }
        feedbackService.deleteFeedback(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Feedback deleted successfully", null));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get feedback stats breakdown (Admin only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFeedbackMetrics() {
        Map<String, Object> metrics = feedbackService.getFeedbackMetrics();
        return ResponseEntity.ok(new ApiResponse<>(true, "Feedback metrics retrieved successfully", metrics));
    }

    private boolean isAdmin(UserPrincipal principal) {
        if (principal == null) return false;
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
