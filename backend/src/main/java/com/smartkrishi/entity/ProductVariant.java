package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_variants", indexes = {
        @Index(name = "idx_product_variants", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Variant SKU is required")
    private String variantSku;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Variant name is required")
    private String variantName;

    @Column(nullable = false, precision = 15, scale = 2)
    @DecimalMin(value = "0.0", message = "Variant price must be non-negative")
    private BigDecimal variantPrice = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal variantDiscountPrice;

    @Column(length = 500)
    private String variantImageUrl;

    @Column(nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
