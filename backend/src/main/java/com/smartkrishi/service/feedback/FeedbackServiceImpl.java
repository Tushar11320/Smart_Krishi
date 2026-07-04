package com.smartkrishi.service.feedback;

import com.smartkrishi.dto.feedback.FeedbackDTO;
import com.smartkrishi.entity.Feedback;
import com.smartkrishi.entity.User;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.FeedbackRepository;
import com.smartkrishi.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public FeedbackDTO createFeedback(FeedbackDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getUserId()));

        Feedback.FeedbackCategory category;
        try {
            category = Feedback.FeedbackCategory.valueOf(dto.getCategory().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid feedback category. Allowed: BUG_REPORT, SUGGESTION, COMPLAINT, FEATURE_REQUEST");
        }

        Feedback.FeedbackPriority priority = Feedback.FeedbackPriority.MEDIUM;
        if (dto.getPriority() != null) {
            try {
                priority = Feedback.FeedbackPriority.valueOf(dto.getPriority().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Keep default MEDIUM
            }
        }

        Feedback feedback = Feedback.builder()
                .user(user)
                .category(category)
                .subject(dto.getSubject())
                .description(dto.getDescription())
                .screenshotUrl(dto.getScreenshotUrl())
                .status(Feedback.FeedbackStatus.PENDING)
                .priority(priority)
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        log.info("Created feedback entry with id {} for user {}", saved.getId(), user.getId());
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public FeedbackDTO updateFeedbackStatus(Long id, String statusStr, String priorityStr) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", id));

        if (statusStr != null) {
            try {
                feedback.setStatus(Feedback.FeedbackStatus.valueOf(statusStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid feedback status. Allowed: PENDING, INVESTIGATING, RESOLVED, DISMISSED");
            }
        }

        if (priorityStr != null) {
            try {
                feedback.setPriority(Feedback.FeedbackPriority.valueOf(priorityStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid feedback priority. Allowed: LOW, MEDIUM, HIGH, CRITICAL");
            }
        }

        Feedback updated = feedbackRepository.save(feedback);
        log.info("Updated feedback status for entry {}", id);
        return mapToDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackDTO getFeedbackById(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", id));
        return mapToDTO(feedback);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedbackDTO> getFeedbacks(String categoryStr, String statusStr, Pageable pageable) {
        Feedback.FeedbackCategory category = null;
        if (categoryStr != null && !categoryStr.trim().isEmpty()) {
            try {
                category = Feedback.FeedbackCategory.valueOf(categoryStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid category filters
            }
        }

        Feedback.FeedbackStatus status = null;
        if (statusStr != null && !statusStr.trim().isEmpty()) {
            try {
                status = Feedback.FeedbackStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid status filters
            }
        }

        Page<Feedback> page;
        if (category != null && status != null) {
            page = feedbackRepository.findByCategoryAndStatus(category, status, pageable);
        } else if (category != null) {
            page = feedbackRepository.findByCategory(category, pageable);
        } else if (status != null) {
            page = feedbackRepository.findByStatus(status, pageable);
        } else {
            page = feedbackRepository.findAll(pageable);
        }

        return page.map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeedbackDTO> getUserFeedbacks(Long userId, Pageable pageable) {
        return feedbackRepository.findByUserId(userId, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public void deleteFeedback(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", id));
        feedbackRepository.delete(feedback);
        log.info("Deleted feedback entry {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getFeedbackMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        List<Map<String, Object>> categoryCounts = feedbackRepository.countByCategoryGrouped();
        Map<String, Long> categoryMap = new HashMap<>();
        for (Map<String, Object> item : categoryCounts) {
            Object key = item.get("category");
            Object val = item.get("count");
            if (key != null && val != null) {
                categoryMap.put(key.toString(), ((Number) val).longValue());
            }
        }
        metrics.put("byCategory", categoryMap);

        List<Map<String, Object>> statusCounts = feedbackRepository.countByStatusGrouped();
        Map<String, Long> statusMap = new HashMap<>();
        for (Map<String, Object> item : statusCounts) {
            Object key = item.get("status");
            Object val = item.get("count");
            if (key != null && val != null) {
                statusMap.put(key.toString(), ((Number) val).longValue());
            }
        }
        metrics.put("byStatus", statusMap);

        List<Map<String, Object>> priorityCounts = feedbackRepository.countByPriorityGrouped();
        Map<String, Long> priorityMap = new HashMap<>();
        for (Map<String, Object> item : priorityCounts) {
            Object key = item.get("priority");
            Object val = item.get("count");
            if (key != null && val != null) {
                priorityMap.put(key.toString(), ((Number) val).longValue());
            }
        }
        metrics.put("byPriority", priorityMap);

        metrics.put("totalCount", feedbackRepository.count());

        return metrics;
    }

    private FeedbackDTO mapToDTO(Feedback feedback) {
        return FeedbackDTO.builder()
                .id(feedback.getId())
                .userId(feedback.getUser().getId())
                .userName(feedback.getUser().getFirstName() + " " + feedback.getUser().getLastName())
                .userEmail(feedback.getUser().getEmail())
                .category(feedback.getCategory().name())
                .subject(feedback.getSubject())
                .description(feedback.getDescription())
                .screenshotUrl(feedback.getScreenshotUrl())
                .status(feedback.getStatus().name())
                .priority(feedback.getPriority().name())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }
}
