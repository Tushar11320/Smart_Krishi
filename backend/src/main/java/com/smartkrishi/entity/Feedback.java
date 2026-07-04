package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks", indexes = {
        @Index(name = "idx_feedback_category", columnList = "category"),
        @Index(name = "idx_feedback_status", columnList = "status"),
        @Index(name = "idx_feedback_user", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user"})
@EqualsAndHashCode(exclude = {"user"})
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private FeedbackCategory category;

    @Column(nullable = false, length = 255)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "screenshot_url", length = 500)
    private String screenshotUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private FeedbackStatus status = FeedbackStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private FeedbackPriority priority = FeedbackPriority.MEDIUM;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum FeedbackCategory {
        BUG_REPORT, SUGGESTION, COMPLAINT, FEATURE_REQUEST
    }

    public enum FeedbackStatus {
        PENDING, INVESTIGATING, RESOLVED, DISMISSED
    }

    public enum FeedbackPriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
