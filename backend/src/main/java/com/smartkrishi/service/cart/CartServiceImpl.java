package com.smartkrishi.service.cart;

import com.smartkrishi.dto.cart.CartDTO;
import com.smartkrishi.dto.cart.CartItemDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public CartDTO addToCart(Long userId, CartItemDTO cartItemDTO) {
        if (userId == null) {
            throw new BadRequestException("User ID cannot be null");
        }
        if (cartItemDTO == null || cartItemDTO.getProductId() == null) {
            throw new BadRequestException("Invalid cart item details");
        }
        log.info("Adding product ID: {} (Quantity: {}) to cart for user ID: {}", 
                cartItemDTO.getProductId(), cartItemDTO.getQuantity(), userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Product product = productRepository.findById(cartItemDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + cartItemDTO.getProductId()));

        if (product.getProductStatus() == null || !product.getProductStatus().equals(Product.ProductStatus.ACTIVE)) {
            throw new BadRequestException("Product is not active or available");
        }

        // Get or create cart
        Cart cart = cartRepository.findByBuyerId(userId)
                .orElseGet(() -> {
                    log.info("No existing cart found for user ID: {}. Creating a new one.", userId);
                    Cart newCart = new Cart();
                    newCart.setBuyer(user);
                    newCart.setTotalItems(0);
                    newCart.setTotalPrice(BigDecimal.ZERO);
                    return cartRepository.save(newCart);
                });

        // Initialize cart items collection if null (prevent NPE)
        if (cart.getCartItems() == null) {
            cart.setCartItems(new java.util.HashSet<>());
        }

        // Check if item already exists in cart
        CartItem existingItem = cart.getCartItems().stream()
                .filter(item -> item != null && item.getProduct() != null && item.getProduct().getId().equals(product.getId()))
                .findFirst()
                .orElse(null);

        BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
        if (unitPrice == null) {
            unitPrice = BigDecimal.ZERO;
        }

        int quantityToAdd = cartItemDTO.getQuantity() != null ? cartItemDTO.getQuantity() : 1;
        if (quantityToAdd <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        if (existingItem != null) {
            // Update quantity
            existingItem.setQuantity(existingItem.getQuantity() + quantityToAdd);
            existingItem.setUnitPrice(unitPrice);
            existingItem.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(existingItem.getQuantity())));
        } else {
            // Add new item
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantityToAdd);
            cartItem.setUnitPrice(unitPrice);
            cartItem.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(quantityToAdd)));
            cart.getCartItems().add(cartItem);
        }

        // Recalculate cart totals
        recalculateCart(cart);
        Cart savedCart = cartRepository.save(cart);

        log.info("Successfully added product {} to cart for user {}. Total items now: {}", product.getId(), userId, savedCart.getTotalItems());
        return mapToDTO(savedCart);
    }

    @Override
    public CartDTO updateCartItem(Long userId, Long cartItemId, Integer quantity) {
        if (userId == null || cartItemId == null) {
            throw new BadRequestException("User ID and Cart Item ID cannot be null");
        }
        log.info("Updating cart item ID: {} for user ID: {} to quantity: {}", cartItemId, userId, quantity);

        Cart cart = cartRepository.findByBuyerId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user ID: " + userId));

        if (cart.getCartItems() == null) {
            cart.setCartItems(new java.util.HashSet<>());
        }

        CartItem cartItem = cart.getCartItems().stream()
                .filter(item -> item != null && item.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + cartItemId));

        int newQuantity = quantity != null ? quantity : 0;
        if (newQuantity <= 0) {
            cart.getCartItems().remove(cartItem);
        } else {
            cartItem.setQuantity(newQuantity);
            BigDecimal unitPrice = cartItem.getUnitPrice() != null ? cartItem.getUnitPrice() : BigDecimal.ZERO;
            cartItem.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(newQuantity)));
        }

        recalculateCart(cart);
        Cart savedCart = cartRepository.save(cart);

        log.info("Successfully updated cart item ID: {} for user ID: {}", cartItemId, userId);
        return mapToDTO(savedCart);
    }

    @Override
    public void removeFromCart(Long userId, Long cartItemId) {
        if (userId == null || cartItemId == null) {
            throw new BadRequestException("User ID and Cart Item ID cannot be null");
        }
        log.info("Removing cart item ID: {} for user ID: {}", cartItemId, userId);

        Cart cart = cartRepository.findByBuyerId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user ID: " + userId));

        if (cart.getCartItems() == null) {
            cart.setCartItems(new java.util.HashSet<>());
        }

        CartItem cartItem = cart.getCartItems().stream()
                .filter(item -> item != null && item.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + cartItemId));

        cart.getCartItems().remove(cartItem);
        recalculateCart(cart);
        cartRepository.save(cart);

        log.info("Successfully removed cart item ID: {} for user ID: {}", cartItemId, userId);
    }

    @Override
    public CartDTO getCart(Long userId) {
        log.info("Retrieving cart for user ID: {}", userId);
        if (userId == null) {
            log.warn("getCart called with null userId. Returning empty fallback cart.");
            return createEmptyCartDTO(null);
        }
        try {
            Optional<Cart> cartOpt = cartRepository.findByBuyerId(userId);
            if (cartOpt.isPresent()) {
                return mapToDTO(cartOpt.get());
            }

            log.info("Cart not found for user ID: {}. Attempting to create one automatically.", userId);
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("Cannot create cart because user ID: {} does not exist. Returning empty fallback cart.", userId);
                return createEmptyCartDTO(userId);
            }

            Cart newCart = new Cart();
            newCart.setBuyer(userOpt.get());
            newCart.setTotalItems(0);
            newCart.setTotalPrice(BigDecimal.ZERO);
            Cart savedCart = cartRepository.save(newCart);
            log.info("Successfully created and saved new cart with ID: {} for user ID: {}", savedCart.getId(), userId);
            return mapToDTO(savedCart);
        } catch (Exception ex) {
            log.error("Database error while retrieving or creating cart for user ID: {}", userId, ex);
            return createEmptyCartDTO(userId);
        }
    }

    @Override
    public void clearCart(Long userId) {
        if (userId == null) {
            throw new BadRequestException("User ID cannot be null");
        }
        log.info("Clearing cart for user ID: {}", userId);

        Cart cart = cartRepository.findByBuyerId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user ID: " + userId));

        if (cart.getCartItems() != null) {
            cart.getCartItems().removeIf(item -> item.getSaveForLater() == null || !item.getSaveForLater());
        }
        recalculateCart(cart);
        cartRepository.save(cart);

        log.info("Successfully cleared active cart for user ID: {}", userId);
    }

    @Override
    public CartDTO toggleSaveForLater(Long userId, Long cartItemId, boolean save) {
        if (userId == null || cartItemId == null) {
            throw new BadRequestException("User ID and Cart Item ID cannot be null");
        }
        log.info("Toggling saveForLater for cart item ID: {} for user ID: {} to {}", cartItemId, userId, save);

        Cart cart = cartRepository.findByBuyerId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user ID: " + userId));

        if (cart.getCartItems() == null) {
            cart.setCartItems(new java.util.HashSet<>());
        }

        CartItem cartItem = cart.getCartItems().stream()
                .filter(item -> item != null && item.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + cartItemId));

        cartItem.setSaveForLater(save);
        recalculateCart(cart);
        Cart savedCart = cartRepository.save(cart);

        log.info("Successfully toggled saveForLater for cart item ID: {} for user ID: {}", cartItemId, userId);
        return mapToDTO(savedCart);
    }

    @Override
    public CartDTO mergeCart(Long userId, CartDTO guestCart) {
        if (userId == null) {
            throw new BadRequestException("User ID cannot be null");
        }
        log.info("Merging guest cart with user cart for user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Get or create cart
        Cart userCart = cartRepository.findByBuyerId(userId)
                .orElseGet(() -> {
                    log.info("No existing cart found for user ID: {}. Creating a new one for merge.", userId);
                    Cart newCart = new Cart();
                    newCart.setBuyer(user);
                    newCart.setTotalItems(0);
                    newCart.setTotalPrice(BigDecimal.ZERO);
                    return cartRepository.save(newCart);
                });

        if (guestCart != null && guestCart.getCartItems() != null) {
            guestCart.getCartItems().forEach(guestItem -> {
                if (guestItem != null && guestItem.getProductId() != null) {
                    CartItemDTO cartItemDTO = new CartItemDTO();
                    cartItemDTO.setProductId(guestItem.getProductId());
                    cartItemDTO.setQuantity(guestItem.getQuantity() != null ? guestItem.getQuantity() : 1);
                    try {
                        addToCart(userId, cartItemDTO);
                    } catch (Exception ex) {
                        log.error("Failed to add guest item with product ID: {} to user cart during merge", 
                                guestItem.getProductId(), ex);
                    }
                }
            });
        }

        log.info("Successfully completed merge for user ID: {}", userId);
        return getCart(userId);
    }

    private void recalculateCart(Cart cart) {
        if (cart == null) return;
        if (cart.getCartItems() == null) {
            cart.setCartItems(new java.util.HashSet<>());
        }
        
        int totalItems = cart.getCartItems().stream()
                .filter(item -> item != null && (item.getSaveForLater() == null || !item.getSaveForLater()))
                .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                .sum();

        BigDecimal totalPrice = cart.getCartItems().stream()
                .filter(item -> item != null && (item.getSaveForLater() == null || !item.getSaveForLater()) && item.getTotalPrice() != null)
                .map(CartItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        cart.setTotalItems(totalItems);
        cart.setTotalPrice(totalPrice);
    }

    private CartDTO mapToDTO(Cart cart) {
        if (cart == null) {
            return null;
        }
        
        List<CartItemDTO> cartItems = java.util.Collections.emptyList();
        if (cart.getCartItems() != null) {
            cartItems = cart.getCartItems().stream()
                    .filter(item -> item != null && item.getProduct() != null)
                    .map(this::mapItemToDTO)
                    .collect(Collectors.toList());
        }

        String buyerName = "Unknown User";
        Long buyerId = null;
        if (cart.getBuyer() != null) {
            buyerId = cart.getBuyer().getId();
            String firstName = cart.getBuyer().getFirstName() != null ? cart.getBuyer().getFirstName() : "";
            String lastName = cart.getBuyer().getLastName() != null ? cart.getBuyer().getLastName() : "";
            buyerName = (firstName + " " + lastName).trim();
            if (buyerName.isEmpty()) {
                buyerName = cart.getBuyer().getEmail();
            }
        }

        return CartDTO.builder()
                .id(cart.getId())
                .buyerId(buyerId)
                .buyerName(buyerName)
                .cartItems(cartItems)
                .totalItems(cart.getTotalItems() != null ? cart.getTotalItems() : 0)
                .totalPrice(cart.getTotalPrice() != null ? cart.getTotalPrice() : BigDecimal.ZERO)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    private CartItemDTO mapItemToDTO(CartItem cartItem) {
        if (cartItem == null) {
            return null;
        }
        Product product = cartItem.getProduct();
        Long productId = product != null ? product.getId() : null;
        String productName = product != null ? product.getProductName() : "Unknown Product";
        
        return CartItemDTO.builder()
                .id(cartItem.getId())
                .cartId(cartItem.getCart() != null ? cartItem.getCart().getId() : null)
                .productId(productId)
                .productName(productName)
                .quantity(cartItem.getQuantity() != null ? cartItem.getQuantity() : 0)
                .unitPrice(cartItem.getUnitPrice() != null ? cartItem.getUnitPrice() : BigDecimal.ZERO)
                .subtotal(cartItem.getTotalPrice() != null ? cartItem.getTotalPrice() : BigDecimal.ZERO)
                .saveForLater(cartItem.getSaveForLater())
                .createdAt(cartItem.getCreatedAt())
                .updatedAt(cartItem.getUpdatedAt())
                .build();
    }

    private CartDTO createEmptyCartDTO(Long userId) {
        return CartDTO.builder()
                .id(0L)
                .buyerId(userId != null ? userId : 0L)
                .buyerName("Guest/Unknown User")
                .cartItems(java.util.Collections.emptyList())
                .totalItems(0)
                .totalPrice(BigDecimal.ZERO)
                .build();
    }
}
