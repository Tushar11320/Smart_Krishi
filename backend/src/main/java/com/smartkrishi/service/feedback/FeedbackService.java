package com.smartkrishi.service.feedback;

import com.smartkrishi.dto.feedback.FeedbackDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface FeedbackService {
    
    FeedbackDTO createFeedback(FeedbackDTO feedbackDTO);
    
    FeedbackDTO updateFeedbackStatus(Long id, String status, String priority);
    
    FeedbackDTO getFeedbackById(Long id);
    
    Page<FeedbackDTO> getFeedbacks(String category, String status, Pageable pageable);
    
    Page<FeedbackDTO> getUserFeedbacks(Long userId, Pageable pageable);
    
    void deleteFeedback(Long id);
    
    Map<String, Object> getFeedbackMetrics();
}
