package com.smartkrishi.repository;

import com.smartkrishi.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    Page<Feedback> findByUserId(Long userId, Pageable pageable);
    
    Page<Feedback> findByCategory(Feedback.FeedbackCategory category, Pageable pageable);
    
    Page<Feedback> findByStatus(Feedback.FeedbackStatus status, Pageable pageable);
    
    Page<Feedback> findByCategoryAndStatus(Feedback.FeedbackCategory category, Feedback.FeedbackStatus status, Pageable pageable);
    
    long countByCategory(Feedback.FeedbackCategory category);
    
    long countByStatus(Feedback.FeedbackStatus status);
    
    @Query("SELECT f.category as category, COUNT(f) as count FROM Feedback f GROUP BY f.category")
    List<Map<String, Object>> countByCategoryGrouped();
    
    @Query("SELECT f.status as status, COUNT(f) as count FROM Feedback f GROUP BY f.status")
    List<Map<String, Object>> countByStatusGrouped();
    
    @Query("SELECT f.priority as priority, COUNT(f) as count FROM Feedback f GROUP BY f.priority")
    List<Map<String, Object>> countByPriorityGrouped();
}
