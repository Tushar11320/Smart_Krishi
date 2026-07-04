# Smart Krishi - Spring Boot JPA Entity Mapping Guide

## Overview

This guide provides complete Spring Boot JPA entity mappings for the Smart Krishi database schema. It includes all major entities, relationships, and best practices for ORM configuration.

---

## 1. Core Configuration

### pom.xml Dependencies

```xml
<dependencies>
    <!-- Spring Boot Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- MySQL Driver -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.33</version>
    </dependency>

    <!-- Hibernate -->
    <dependency>
        <groupId>org.hibernate</groupId>
        <artifactId>hibernate-core</artifactId>
    </dependency>

    <!-- Lombok for reducing boilerplate -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
</dependencies>
```

### application.yml Configuration

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/smart_krishi?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate  # Never use 'create' in production
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true
        use_sql_comments: true
        jdbc:
          batch_size: 20
          fetch_size: 50
        order_inserts: true
        order_updates: true
    show-sql: false
    open-in-view: false  # Always disable in production

  jpa:
    logging:
      level:
        org.hibernate.SQL: DEBUG
        org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

---

## 2. Entity Mapping Examples

### 2.1 User Entity (Core)

```java
package com.smartkrishi.entity;

import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(name = "uk_email", columnNames = "email"),
    @UniqueConstraint(name = "uk_phone", columnNames = "phone")
}, indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_phone", columnList = "phone"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"roles", "loginHistories", "orders"})
@EqualsAndHashCode(exclude = {"roles", "loginHistories", "orders"})
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 255)
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;
    
    @Column(nullable = false, unique = true, length = 20)
    @NotBlank(message = "Phone is required")
    private String phone;
    
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Password is required")
    private String passwordHash;
    
    @Column(nullable = false, length = 100)
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @Column(nullable = false, length = 100)
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;
    
    @Column(nullable = false)
    private Boolean emailVerified = false;
    
    @Column(nullable = false)
    private Boolean phoneVerified = false;
    
    @Column(nullable = false)
    private Boolean twoFactorEnabled = false;
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<UserRole> roles = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<LoginHistory> loginHistories = new HashSet<>();
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private BuyerProfile buyerProfile;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SellerProfile sellerProfile;
    
    @OneToMany(mappedBy = "buyer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Order> orders = new HashSet<>();
    
    // Enum for user status
    public enum UserStatus {
        ACTIVE, INACTIVE, SUSPENDED, DELETED
    }
}
```

### 2.2 Seller Profile Entity

```java
package com.smartkrishi.entity;

import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "seller_profiles", indexes = {
    @Index(name = "idx_seller_status", columnList = "seller_status"),
    @Index(name = "idx_rating", columnList = "rating"),
    @Index(name = "idx_business_category", columnList = "business_category")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"user", "businessInfo", "products", "orders"})
@EqualsAndHashCode(exclude = {"user", "businessInfo", "products", "orders"})
public class SellerProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Business name is required")
    private String businessName;
    
    @Column(columnDefinition = "TEXT")
    private String businessDescription;
    
    @Column(nullable = false, length = 100)
    private String businessCategory; // MACHINERY, FERTILIZERS, DAIRY, etc.
    
    @Column(length = 500)
    private String businessWebsite;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SellerStatus sellerStatus = SellerStatus.PENDING;
    
    @Column(length = 500)
    private String verificationDocumentUrl;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(name = "verified_by_admin_id")
    private Long verifiedByAdminId;
    
    @Column(columnDefinition = "TEXT")
    private String approvalNotes;
    
    @Column(length = 500)
    private String logoUrl;
    
    @Column(nullable = false)
    private Integer totalProducts = 0; // Denormalized
    
    @Column(nullable = false)
    private BigDecimal totalSales = BigDecimal.ZERO; // Denormalized
    
    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO; // Denormalized
    
    @Column(nullable = false)
    private Integer reviewCount = 0;
    
    @Column(nullable = false)
    private Integer responseTimeHours = 0;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal returnRate = BigDecimal.ZERO;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal cancellationRate = BigDecimal.ZERO;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToOne(mappedBy = "sellerProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SellerBusinessInfo businessInfo;
    
    @OneToMany(mappedBy = "seller", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Product> products = new HashSet<>();
    
    @OneToMany(mappedBy = "seller", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Order> orders = new HashSet<>();
    
    @OneToMany(mappedBy = "seller", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<SellerBankAccount> bankAccounts = new HashSet<>();
    
    public enum SellerStatus {
        PENDING, VERIFIED, SUSPENDED, REJECTED
    }
}
```

### 2.3 Product Entity

```java
package com.smartkrishi.entity;

import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.search.mapper.pojo.mapping.definition.annotation.FullTextField;
import org.hibernate.search.mapper.pojo.mapping.definition.annotation.Indexed;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_seller_id", columnList = "seller_id"),
    @Index(name = "idx_category_id", columnList = "category_id"),
    @Index(name = "idx_product_status", columnList = "product_status"),
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_rating", columnList = "rating"),
    @Index(name = "idx_bestseller", columnList = "is_bestseller")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"seller", "category", "subcategory", "images", "inventory", "variants"})
@EqualsAndHashCode(exclude = {"seller", "category", "subcategory", "images", "inventory", "variants"})
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subcategory_id", nullable = false)
    private SubCategory subcategory;
    
    @Column(nullable = false, length = 100)
    @NotBlank(message = "SKU is required")
    private String sku;
    
    @Column(nullable = false, length = 500)
    @NotBlank(message = "Product name is required")
    @FullTextField
    private String productName;
    
    @Column(columnDefinition = "LONGTEXT")
    @FullTextField
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
    private BigDecimal rating = BigDecimal.ZERO; // Denormalized
    
    @Column(nullable = false)
    private Integer reviewCount = 0; // Denormalized
    
    @Column(nullable = false)
    private Integer purchaseCount = 0;
    
    @Column(nullable = false)
    private Integer viewCount = 0;
    
    @Column(nullable = false)
    private Boolean isFeatured = false;
    
    @Column(nullable = false)
    private Boolean isBestseller = false;
    
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
    
    // Relationships
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<ProductImage> images = new HashSet<>();
    
    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ProductInventory inventory;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<ProductVariant> variants = new HashSet<>();
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Review> reviews = new HashSet<>();
    
    public enum ProductStatus {
        ACTIVE, DRAFT, INACTIVE, DELETED
    }
}
```

### 2.4 Order Entity with Multi-Vendor Support

```java
package com.smartkrishi.entity;

import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_buyer_id", columnList = "buyer_id"),
    @Index(name = "idx_seller_id", columnList = "primary_seller_id"),
    @Index(name = "idx_order_status", columnList = "order_status"),
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_buyer_status", columnList = "buyer_id, order_status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"buyer", "seller", "orderItems", "payment"})
@EqualsAndHashCode(exclude = {"buyer", "seller", "orderItems", "payment"})
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String orderNumber; // ORD-20240101-00001
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "primary_seller_id", nullable = false)
    private SellerProfile seller;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus orderStatus = OrderStatus.PENDING;
    
    @Column(nullable = false)
    private Integer totalItemsCount = 0;
    
    @Column(nullable = false, precision = 15, scale = 2)
    @DecimalMin(value = "0.0", message = "Subtotal must be non-negative")
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
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shipping_address_id", nullable = false)
    private UserAddress shippingAddress;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;
    
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
    
    // Relationships
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<OrderItem> orderItems = new HashSet<>();
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<OrderHistory> histories = new HashSet<>();
    
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private OrderTracking tracking;
    
    public enum OrderStatus {
        PENDING, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED
    }
}
```

### 2.5 Review Entity

```java
package com.smartkrishi.entity;

import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "reviews", 
    uniqueConstraints = @UniqueConstraint(name = "uk_review", columnNames = {"product_id", "buyer_id", "order_item_id"}),
    indexes = {
        @Index(name = "idx_product_id", columnList = "product_id"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_rating", columnList = "rating"),
        @Index(name = "idx_product_created", columnList = "product_id, created_at DESC")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"product", "buyer", "orderItem", "images"})
@EqualsAndHashCode(exclude = {"product", "buyer", "orderItem", "images"})
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;
    
    @Column(nullable = false)
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    @NotNull(message = "Rating is required")
    private Integer rating;
    
    @Column(length = 500)
    private String reviewTitle;
    
    @Column(columnDefinition = "TEXT")
    private String reviewText;
    
    @Column(nullable = false)
    private Boolean isVerifiedPurchase = true;
    
    @Column(nullable = false)
    private Integer helpfulCount = 0;
    
    @Column(nullable = false)
    private Integer unhelpfulCount = 0;
    
    @Column(columnDefinition = "TEXT")
    private String sellerResponse;
    
    @Column(name = "seller_response_at")
    private LocalDateTime sellerResponseAt;
    
    @Column(nullable = false)
    private Boolean isApproved = true;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<ReviewImage> images = new HashSet<>();
}
```

### 2.6 Message Entity (Chat)

```java
package com.smartkrishi.entity;

import lombok.*;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_conversation_created", columnList = "conversation_id, created_at"),
    @Index(name = "idx_is_read", columnList = "is_read")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"conversation", "sender", "attachments"})
@EqualsAndHashCode(exclude = {"conversation", "sender", "attachments"})
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    @Column(columnDefinition = "LONGTEXT")
    private String messageText;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType messageType = MessageType.TEXT;
    
    @Column(nullable = false)
    private Boolean isRead = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Relationships
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<MessageAttachment> attachments = new HashSet<>();
    
    public enum MessageType {
        TEXT, IMAGE, DOCUMENT, VIDEO
    }
}
```

---

## 3. Repository Interfaces

### Example: Product Repository

```java
package com.smartkrishi.repository;

import com.smartkrishi.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Basic queries
    Optional<Product> findBySellerIdAndSku(Long sellerId, String sku);
    
    Page<Product> findBySellerIdAndProductStatus(Long sellerId, Product.ProductStatus status, Pageable pageable);
    
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    
    // JPQL queries
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.productStatus = 'ACTIVE' ORDER BY p.rating DESC")
    List<Product> findTopProductsByCategory(@Param("categoryId") Long categoryId, Pageable pageable);
    
    // Full-text search
    @Query(value = "SELECT * FROM products WHERE MATCH(product_name, product_description) AGAINST(:searchTerm IN BOOLEAN MODE) AND product_status = 'ACTIVE'", nativeQuery = true)
    Page<Product> searchByKeyword(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Aggregation query
    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId AND p.isBestseller = true")
    List<Product> findBestsellersBySellerTop10(@Param("sellerId") Long sellerId);
    
    // Complex filter
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.price BETWEEN :minPrice AND :maxPrice AND p.productStatus = 'ACTIVE'")
    Page<Product> findByPriceRange(@Param("categoryId") Long categoryId, @Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice, Pageable pageable);
}
```

### Example: Order Repository

```java
package com.smartkrishi.repository;

import com.smartkrishi.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Basic queries
    Optional<Order> findByOrderNumber(String orderNumber);
    
    Page<Order> findByBuyerId(Long buyerId, Pageable pageable);
    
    Page<Order> findByBuyerIdAndOrderStatus(Long buyerId, Order.OrderStatus status, Pageable pageable);
    
    Page<Order> findBySellerId(Long sellerId, Pageable pageable);
    
    // Date-based queries
    @Query("SELECT o FROM Order o WHERE o.buyer.id = :buyerId AND DATE(o.createdAt) BETWEEN :startDate AND :endDate")
    Page<Order> findByBuyerIdAndDateRange(@Param("buyerId") Long buyerId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);
    
    // Dashboard analytics
    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = 'DELIVERED' AND DATE(o.updatedAt) = CURRENT_DATE")
    Long countTodayDeliveredOrders();
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.orderStatus = 'DELIVERED' AND MONTH(o.createdAt) = :month AND YEAR(o.createdAt) = :year")
    java.math.BigDecimal getTotalSalesByMonth(@Param("month") Integer month, @Param("year") Integer year);
    
    // Multi-vendor orders
    @Query("SELECT o FROM Order o WHERE o.seller.id = :sellerId AND o.orderStatus IN ('CONFIRMED', 'PACKED', 'SHIPPED')")
    List<Order> findPendingFulfillmentOrders(@Param("sellerId") Long sellerId);
}
```

---

## 4. Service Layer Example

```java
package com.smartkrishi.service;

import com.smartkrishi.entity.Product;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.dto.ProductDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    
    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByCategoryId(categoryId, pageable)
                .map(this::convertToDTO);
    }
    
    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.searchByKeyword(keyword, pageable)
                .map(this::convertToDTO);
    }
    
    public Product createProduct(ProductDTO dto) {
        Product product = new Product();
        // Map DTO to entity
        return productRepository.save(product);
    }
    
    private ProductDTO convertToDTO(Product product) {
        // Convert entity to DTO
        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getProductName())
                .price(product.getPrice())
                .rating(product.getRating())
                .build();
    }
}
```

---

## 5. Best Practices for JPA Mapping

### 1. **Lazy Loading by Default**
```java
@ManyToOne(fetch = FetchType.LAZY)  // Avoid N+1 queries
@OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
```

### 2. **Use DTOs to Prevent LazyInitializationException**
```java
// Service layer: Convert entity to DTO before returning to controller
@Transactional
public ProductDTO getProduct(Long id) {
    Product product = productRepository.findById(id).orElseThrow();
    // Load all needed associations before transaction ends
    product.getImages().size(); // Trigger lazy load
    return convertToDTO(product);
}
```

### 3. **Use @Transactional for Read Operations**
```java
@Transactional(readOnly = true)
public Page<ProductDTO> searchProducts(String keyword, Pageable pageable) {
    // Enables read-only optimization, uses read replica
    return productRepository.searchByKeyword(keyword, pageable)
            .map(this::convertToDTO);
}
```

### 4. **Optimize Queries with Projections**
```java
public interface ProductProjection {
    Long getId();
    String getProductName();
    BigDecimal getPrice();
}

@Query("SELECT p.id as id, p.productName as productName, p.price as price FROM Product p")
Page<ProductProjection> findProductProjections(Pageable pageable);
```

### 5. **Batch Operations**
```java
// In application.yml
spring.jpa.properties.hibernate.jdbc.batch_size: 20
spring.jpa.properties.hibernate.order_inserts: true
spring.jpa.properties.hibernate.order_updates: true
```

### 6. **Denormalization for Performance**
```java
// Keep frequently accessed aggregates denormalized
@Column(nullable = false)
private Integer totalProducts = 0;

@Column(precision = 3, scale = 2)
private BigDecimal averageRating = BigDecimal.ZERO;

// Update via batch job nightly
@Scheduled(cron = "0 2 * * * ?") // 2 AM daily
public void updateDenormalizedFields() {
    // Recalculate from source tables
}
```

### 7. **Cascade Strategy**
```java
// Use CASCADE for parent-child relationships
@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
private Set<ProductImage> images = new HashSet<>();

// Use RESTRICT or NO_ACTION for important references
@ManyToOne
@JoinColumn(foreign Key = @ForeignKey(name = "fk_product_category", value = ConstraintMode.CONSTRAINT))
private Category category;
```

---

## 6. Performance Tuning

### Connection Pool Configuration

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20        # For 1M users, start with 20
      minimum-idle: 5              # Keep 5 connections ready
      connection-timeout: 30000    # 30 seconds
      idle-timeout: 600000         # 10 minutes
      max-lifetime: 1800000        # 30 minutes
      auto-commit: true
```

### Batch Query Configuration

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 20           # Batch insert/update 20 at a time
          fetch_size: 50           # Fetch 50 rows at a time
        order_inserts: true        # Order inserts for better performance
        order_updates: true        # Order updates for better performance
```

### Query Optimization

```java
// ✅ Good: Use FETCH JOIN to avoid N+1
@Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id = :id")
Optional<Product> findByIdWithImages(@Param("id") Long id);

// ❌ Bad: Causes N+1 query problem
Product product = productRepository.findById(id);
product.getImages().size(); // Separate query for each product
```

---

## 7. Summary

**Total Entities**: 75 classes  
**Total Repositories**: ~30 repositories  
**Total DTOs**: ~40 DTO classes (not shown, but recommended)  
**Configuration Files**: 2-3 YAML files  
**Service Classes**: ~20-25 service classes

All entities follow these patterns:
- Surrogate keys (Long ID)
- Timestamps (createdAt, updatedAt)
- Soft deletes (deletedAt)
- Proper indexing annotations
- Lazy loading for relationships
- Validation annotations
- Lombok for reduced boilerplate
