package com.smartkrishi.repository;

import com.smartkrishi.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findBySku(String sku);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    Page<Product> findBySubcategoryId(Long subcategoryId, Pageable pageable);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    Page<Product> findBySellerIdAndProductStatus(Long sellerId, Product.ProductStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    Page<Product> findByProductStatus(Product.ProductStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"images", "inventory"})
    List<Product> findByProductStatus(Product.ProductStatus status);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    @Query("SELECT p FROM Product p WHERE p.productName LIKE %:keyword% OR p.productDescription LIKE %:keyword%")
    Page<Product> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.productStatus = 'ACTIVE' ORDER BY p.rating DESC")
    List<Product> findTopProductsByCategory(@Param("categoryId") Long categoryId, Pageable pageable);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    @Query("SELECT p FROM Product p WHERE p.isBestseller = true AND p.productStatus = 'ACTIVE' ORDER BY p.purchaseCount DESC")
    Page<Product> findBestsellerProducts(Pageable pageable);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    @Query("SELECT p FROM Product p WHERE p.isFeatured = true AND p.productStatus = 'ACTIVE'")
    Page<Product> findFeaturedProducts(Pageable pageable);
    
    @EntityGraph(attributePaths = {"images", "inventory"})
    Page<Product> findBySellerIdAndDeletedAtIsNull(Long sellerId, Pageable pageable);

    @EntityGraph(attributePaths = {"images", "inventory"})
    Page<Product> findByDeletedAtIsNull(Pageable pageable);

    long countByProductStatus(Product.ProductStatus status);

    @EntityGraph(attributePaths = {"images", "inventory"})
    List<Product> findBySellerIdAndDeletedAtIsNull(Long sellerId);

    Long countBySellerIdAndDeletedAtIsNull(Long sellerId);
}
