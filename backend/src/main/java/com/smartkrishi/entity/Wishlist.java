package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wishlists", indexes = {
        @Index(name = "idx_wishlists_buyer_id", columnList = "buyer_id"),
        @Index(name = "idx_wishlists_product_id", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"buyer", "product"})
@EqualsAndHashCode(exclude = {"buyer", "product"})
public class Wishlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
