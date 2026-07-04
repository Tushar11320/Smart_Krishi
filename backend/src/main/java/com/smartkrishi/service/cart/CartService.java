package com.smartkrishi.service.cart;

import com.smartkrishi.dto.cart.CartDTO;
import com.smartkrishi.dto.cart.CartItemDTO;

public interface CartService {
    
    CartDTO addToCart(Long userId, CartItemDTO cartItemDTO);
    
    CartDTO updateCartItem(Long userId, Long cartItemId, Integer quantity);
    
    void removeFromCart(Long userId, Long cartItemId);
    
    CartDTO getCart(Long userId);
    
    void clearCart(Long userId);
    
    CartDTO toggleSaveForLater(Long userId, Long cartItemId, boolean save);
    
    CartDTO mergeCart(Long userId, CartDTO guestCart);
}
