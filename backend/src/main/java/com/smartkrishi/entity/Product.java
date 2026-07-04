package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_category_id", columnList = "category_id"),
        @Index(name = "idx_product_status", columnList = "product_status"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_products_cat_status", columnList = "category_id, product_status, deleted_at"),
        @Index(name = "idx_products_seller_deleted", columnList = "seller_id, deleted_at"),
        @Index(name = "idx_products_status_created", columnList = "product_status, created_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"seller", "category", "subcategory", "images", "inventory"})
@EqualsAndHashCode(exclude = {"seller", "category", "subcategory", "images", "inventory"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "seller_id", nullable = true)
    private SellerProfile seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "subcategory_id", nullable = true)
    private SubCategory subcategory;

    @Column(nullable = false, unique = true, length = 100)
    @NotBlank(message = "SKU is required")
    private String sku;

    @Column(nullable = false, length = 500)
    @NotBlank(message = "Product name is required")
    private String productName;

    @Column(columnDefinition = "LONGTEXT")
    private String productDescription;

    @Column(length = 1000)
    private String shortDescription;

    @Column(nullable = false, precision = 15, scale = 2)
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @NotNull(message = "Price is required")
    private BigDecimal price;

    @Column(precision = 15, scale = 2)
    @DecimalMin(value = "0.0", message = "Discount price must be non-negative")
    private BigDecimal discountPrice;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus productStatus = ProductStatus.DRAFT;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer reviewCount = 0;

    @Column(nullable = false)
    private Integer purchaseCount = 0;

    @Column(nullable = false)
    private Integer viewCount = 0;

    @Column(nullable = false)
    private Boolean isFeatured = false;

    @Column(nullable = false)
    private Boolean isBestseller = false;

    private Double latitude;
    private Double longitude;

    @Column(length = 1000)
    private String address;

    @Column(nullable = false)
    private Integer returnPolicyDays = 7;

    @Column(nullable = false)
    private Integer warrantyMonths = 0;

    @Column(length = 500)
    private String seoTitle;

    @Column(length = 1000)
    private String seoDescription;

    @Column(length = 1000)
    private String seoKeywords;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<ProductImage> images = new HashSet<>();

    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ProductInventory inventory;

    public enum ProductStatus {
        ACTIVE, DRAFT, INACTIVE, DELETED
    }
}
