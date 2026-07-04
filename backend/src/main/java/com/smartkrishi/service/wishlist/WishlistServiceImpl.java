package com.smartkrishi.service.wishlist;

import com.smartkrishi.dto.wishlist.WishlistDTO;
import com.smartkrishi.entity.Product;
import com.smartkrishi.entity.User;
import com.smartkrishi.entity.Wishlist;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.repository.UserRepository;
import com.smartkrishi.repository.WishlistRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public WishlistDTO addToWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (wishlistRepository.existsByBuyerIdAndProductId(userId, productId)) {
            throw new BadRequestException("Product already in wishlist");
        }

        Wishlist wishlist = new Wishlist();
        wishlist.setBuyer(user);
        wishlist.setProduct(product);

        Wishlist saved = wishlistRepository.save(wishlist);
        log.info("Added product {} to wishlist for user {}", productId, userId);

        return mapToDTO(saved);
    }

    @Override
    public void removeFromWishlist(Long userId, Long productId) {
        Wishlist wishlist = wishlistRepository.findByBuyerIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not in wishlist"));

        wishlistRepository.delete(wishlist);
        log.info("Removed product {} from wishlist for user {}", productId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WishlistDTO> getWishlist(Long userId, Pageable pageable) {
        return wishlistRepository.findByBuyerId(userId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistRepository.existsByBuyerIdAndProductId(userId, productId);
    }

    @Override
    public void clearWishlist(Long userId) {
        wishlistRepository.deleteByBuyerId(userId);
        log.info("Cleared wishlist for user {}", userId);
    }

    private WishlistDTO mapToDTO(Wishlist wishlist) {
        Product product = wishlist.getProduct();
        return WishlistDTO.builder()
                .id(wishlist.getId())
                .buyerId(wishlist.getBuyer().getId())
                .productId(product.getId())
                .productName(product.getProductName())
                .productImage(product.getImages().isEmpty() ? null : 
                    product.getImages().iterator().next().getImageUrl())
                .createdAt(wishlist.getCreatedAt())
                .build();
    }
}
