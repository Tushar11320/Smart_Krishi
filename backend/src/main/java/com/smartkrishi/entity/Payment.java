package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_order_id", columnList = "order_id"),
        @Index(name = "idx_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_payment_status", columnList = "payment_status"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "order", "buyer" })
@EqualsAndHashCode(exclude = { "order", "buyer" })
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(name = "payment_method", nullable = false, length = 100)
    private String paymentMethod = "RAZORPAY";

    @Column(name = "transaction_id", length = 255)
    private String transactionId;

    @Column(nullable = false, unique = true, length = 100)
    private String razorpayOrderId;

    @Column(length = 100)
    private String razorpayPaymentId;

    @Column(length = 100)
    private String razorpaySignature;

    @Column(nullable = false, precision = 15, scale = 2)
    @DecimalMin(value = "0.0", message = "Amount must be non-negative")
    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @Column(name = "platform_fee", precision = 15, scale = 2)
    private BigDecimal platformFee = BigDecimal.ZERO;

    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.INITIATED;

    @Column(length = 500)
    private String failureReason;

    @Column(name = "gateway_response", columnDefinition = "TEXT")
    private String gatewayResponse;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum PaymentStatus {
        INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED, PARTIALLY_REFUNDED
    }
}
