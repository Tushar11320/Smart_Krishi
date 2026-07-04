package com.smartkrishi.service.wishlist;

import com.smartkrishi.dto.wishlist.WishlistDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WishlistService {
    
    WishlistDTO addToWishlist(Long userId, Long productId);
    
    void removeFromWishlist(Long userId, Long productId);
    
    Page<WishlistDTO> getWishlist(Long userId, Pageable pageable);
    
    boolean isInWishlist(Long userId, Long productId);
    
    void clearWishlist(Long userId);
}
