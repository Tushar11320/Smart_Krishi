package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "land_visit_requests", indexes = {
        @Index(name = "idx_visit_land_id", columnList = "land_listing_id"),
        @Index(name = "idx_visit_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_visit_status", columnList = "request_status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"landListing", "buyer"})
@EqualsAndHashCode(exclude = {"landListing", "buyer"})
public class LandVisitRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "land_listing_id", nullable = false)
    private LandListing landListing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(nullable = false, length = 100)
    private String buyerName;

    @Column(nullable = false, length = 20)
    private String buyerPhone;

    @Column(nullable = false, length = 255)
    private String buyerEmail;

    @Column(nullable = false)
    private LocalDate visitDate;

    @Column(nullable = false, length = 20)
    private String visitTime;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus requestStatus = RequestStatus.PENDING;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum RequestStatus {
        PENDING, APPROVED, CANCELLED, COMPLETED
    }
}
