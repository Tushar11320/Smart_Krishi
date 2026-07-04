package com.smartkrishi.repository;

import com.smartkrishi.entity.Wishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    
    Optional<Wishlist> findByBuyerIdAndProductId(Long buyerId, Long productId);
    
    Page<Wishlist> findByBuyerId(Long buyerId, Pageable pageable);
    
    Boolean existsByBuyerIdAndProductId(Long buyerId, Long productId);
    
    Long deleteByBuyerIdAndProductId(Long buyerId, Long productId);
    
    void deleteByBuyerId(Long buyerId);
}
