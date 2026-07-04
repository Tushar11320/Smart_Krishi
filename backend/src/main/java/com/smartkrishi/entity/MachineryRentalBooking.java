package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "machinery_rental_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MachineryRentalBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machinery_id", nullable = false)
    private Machinery machinery;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "security_deposit", nullable = false, precision = 15, scale = 2)
    private BigDecimal securityDeposit;

    @Column(name = "booking_status", nullable = false, length = 50)
    private String bookingStatus; // PENDING, ACCEPTED, PROCESSING, READY_FOR_PICKUP, SHIPPED, DELIVERED, COMPLETED, CANCELLED

    @Column(name = "return_confirmed")
    private Boolean returnConfirmed = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
