package com.smartkrishi.service.product;

import com.smartkrishi.dto.product.ProductDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    
    ProductDTO createProduct(ProductDTO productDTO);
    
    ProductDTO getProductById(Long id);
    
    Page<ProductDTO> getAllProducts(Pageable pageable);
    
    Page<ProductDTO> getProductsByCategory(Long categoryId, Pageable pageable);
    
    Page<ProductDTO> getProductsBySubcategory(Long subcategoryId, Pageable pageable);
    
    Page<ProductDTO> getProductsBySeller(Long sellerId, Pageable pageable);

    Page<ProductDTO> getSellerProductsAll(Long sellerId, Pageable pageable);
    
    Page<ProductDTO> searchProducts(String keyword, Pageable pageable);
    
    List<ProductDTO> getFeaturedProducts();
    
    List<ProductDTO> getBestsellers();
    
    ProductDTO updateProduct(Long id, ProductDTO productDTO);
    
    void deleteProduct(Long id);
    
    ProductDTO getProductBySku(String sku);

    Page<ProductDTO> getAllProductsAdmin(Pageable pageable);
    
    ProductDTO updateProductStatus(Long id, String status);

    List<ProductDTO> getNearbyProducts(double latitude, double longitude, double radiusKm, String sortBy);
}
