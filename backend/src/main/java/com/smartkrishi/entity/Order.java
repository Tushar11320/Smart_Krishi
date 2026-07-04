package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_order_status", columnList = "order_status"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_orders_buyer_created", columnList = "buyer_id, created_at DESC"),
        @Index(name = "idx_orders_seller_status", columnList = "seller_id, order_status"),
        @Index(name = "idx_orders_status_created", columnList = "order_status, created_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "buyer", "seller", "orderItems", "payment" })
@EqualsAndHashCode(exclude = { "buyer", "seller", "orderItems", "payment" })
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "seller_id", nullable = true)
    private SellerProfile seller;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus orderStatus = OrderStatus.PENDING;

    @Column(nullable = false)
    private Integer totalItemsCount = 0;

    @Column(nullable = false, precision = 15, scale = 2)
    @DecimalMin(value = "0.0", message = "Subtotal must be non-negative")
    @NotNull(message = "Subtotal is required")
    private BigDecimal subtotalAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal shippingCharge = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    @DecimalMin(value = "0.0", message = "Total amount must be non-negative")
    private BigDecimal totalAmount;

    @Column(name = "order_amount", precision = 15, scale = 2)
    private BigDecimal orderAmount = BigDecimal.ZERO;

    @Column(name = "platform_fee", precision = 15, scale = 2)
    private BigDecimal platformFee = BigDecimal.ZERO;

    @Column(name = "seller_amount", precision = 15, scale = 2)
    private BigDecimal sellerAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", precision = 15, scale = 2)
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(length = 500)
    private String shippingAddress;

    @Column
    private String deliveryCity;

    @Column
    private String deliveryState;

    @Column
    private String deliveryZipCode;

    @Column(length = 100)
    private String couponCode;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private LocalDate actualDeliveryDate;

    @Column(length = 500)
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<OrderItem> orderItems = new HashSet<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    public enum OrderStatus {
        PENDING, ACCEPTED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED, REFUNDED
    }
}

