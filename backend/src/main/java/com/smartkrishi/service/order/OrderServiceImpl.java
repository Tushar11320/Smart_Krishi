package com.smartkrishi.service.order;

import com.smartkrishi.dto.order.OrderDTO;
import com.smartkrishi.dto.order.OrderItemDTO;
import com.smartkrishi.entity.*;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.*;
import com.smartkrishi.security.UserPrincipal;
import org.springframework.security.access.AccessDeniedException;
import lombok.AllArgsConstructor;
import java.util.Optional;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final DeliveryProfileRepository deliveryProfileRepository;
    private final com.smartkrishi.service.notification.NotificationService notificationService;


    @Override
    public OrderDTO createOrder(OrderDTO orderDTO) {
        // Verify buyer exists
        User buyer = userRepository.findById(orderDTO.getBuyerId())
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found"));

        // Create order
        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setBuyer(buyer);
        order.setOrderStatus(Order.OrderStatus.PENDING);
        order.setSubtotalAmount(orderDTO.getSubtotalAmount());
        order.setDiscountAmount(orderDTO.getDiscountAmount());
        order.setTaxAmount(orderDTO.getTaxAmount());
        order.setShippingCharge(orderDTO.getShippingCharge());
        order.setTotalAmount(orderDTO.getTotalAmount());
        order.setShippingAddress(orderDTO.getShippingAddress());

        // Determine and set seller before initial save to satisfy database constraints
        if (orderDTO.getOrderItems() != null && !orderDTO.getOrderItems().isEmpty()) {
            OrderItemDTO firstItem = orderDTO.getOrderItems().iterator().next();
            Product product = productRepository.findById(firstItem.getProductId()).orElse(null);
            if (product != null && product.getSeller() != null) {
                order.setSeller(product.getSeller());
            }
        }

        Order savedOrder = orderRepository.save(order);

        java.util.Set<OrderItem> items = new java.util.HashSet<>();
        if (orderDTO.getOrderItems() != null) {
            for (OrderItemDTO itemDTO : orderDTO.getOrderItems()) {
                Product product = productRepository.findById(itemDTO.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemDTO.getProductId()));
                
                OrderItem item = new OrderItem();
                item.setOrder(savedOrder);
                item.setProduct(product);
                item.setQuantity(itemDTO.getQuantity());
                item.setUnitPrice(product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice());
                item.setTotalPrice(item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())));
                item.setItemStatus(OrderItem.ItemStatus.PENDING);
                
                // Deduct stock
                if (product.getInventory() != null) {
                    ProductInventory inventory = product.getInventory();
                    int updatedQty = inventory.getQuantityAvailable() - item.getQuantity();
                    if (updatedQty < 0) {
                        throw new BadRequestException("Insufficient stock for product: " + product.getProductName());
                    }
                    inventory.setQuantityAvailable(updatedQty);
                    inventory.setQuantitySold(inventory.getQuantitySold() + item.getQuantity());
                }
                
                orderItemRepository.save(item);
                items.add(item);
                
                // Set order's seller if not set
                if (savedOrder.getSeller() == null && product.getSeller() != null) {
                    savedOrder.setSeller(product.getSeller());
                }
            }
        }
        savedOrder.setOrderItems(items);
        savedOrder.setTotalItemsCount(items.stream().mapToInt(OrderItem::getQuantity).sum());

        // Recompute all amounts on backend to prevent frontend manipulation
        java.math.BigDecimal subtotal = items.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal platformFee = calculatePlatformFee(subtotal);
        java.math.BigDecimal sellerAmount = subtotal.subtract(platformFee);
        java.math.BigDecimal discount = savedOrder.getDiscountAmount() != null ? savedOrder.getDiscountAmount() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal tax = subtotal.multiply(java.math.BigDecimal.valueOf(0.05)).setScale(2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal shipping = subtotal.compareTo(java.math.BigDecimal.ZERO) > 0 ? java.math.BigDecimal.valueOf(350) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal finalAmount = subtotal.add(tax).add(shipping).add(platformFee).subtract(discount);

        savedOrder.setSubtotalAmount(subtotal);
        savedOrder.setOrderAmount(subtotal);
        savedOrder.setPlatformFee(platformFee);
        savedOrder.setSellerAmount(sellerAmount);
        savedOrder.setTaxAmount(tax);
        savedOrder.setShippingCharge(shipping);
        savedOrder.setTotalAmount(finalAmount);
        savedOrder.setFinalAmount(finalAmount);

        savedOrder = orderRepository.save(savedOrder);

        log.info("Order created with order number: {}", savedOrder.getOrderNumber());

        // Clear active cart items for the buyer
        try {
            java.util.Optional<Cart> cartOpt = cartRepository.findByBuyerId(buyer.getId());
            if (cartOpt.isPresent()) {
                Cart cart = cartOpt.get();
                if (cart.getCartItems() != null) {
                    cart.getCartItems().removeIf(item -> item.getSaveForLater() == null || !item.getSaveForLater());
                    // Recalculate cart totals
                    int totalItems = cart.getCartItems().stream()
                            .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                            .sum();
                    java.math.BigDecimal totalPrice = cart.getCartItems().stream()
                            .map(CartItem::getTotalPrice)
                            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                    cart.setTotalItems(totalItems);
                    cart.setTotalPrice(totalPrice);
                    cartRepository.save(cart);
                    log.info("Cleared active cart items for user ID: {} after placing order", buyer.getId());
                }
            }
        } catch (Exception ex) {
            log.error("Failed to clear cart for user ID: {} after order creation", buyer.getId(), ex);
        }
        
        try {
            notificationService.sendEventNotification(
                buyer,
                "ORDER_PLACED",
                "Order Placed Successfully",
                "Your order " + savedOrder.getOrderNumber() + " of amount Rs. " + savedOrder.getFinalAmount() + " has been successfully placed.",
                "ORDER",
                savedOrder.getId().toString()
            );
        } catch (Exception ex) {
            log.error("Failed to send ORDER_PLACED notification for order ID: {}", savedOrder.getId(), ex);
        }

        return mapOrderToDTO(savedOrder);
    }

    private java.math.BigDecimal calculatePlatformFee(java.math.BigDecimal subtotal) {
        if (subtotal == null) return java.math.BigDecimal.ZERO;
        double amt = subtotal.doubleValue();
        double feePercent;
        if (amt <= 5000.0) {
            feePercent = 0.035;
        } else if (amt <= 20000.0) {
            feePercent = 0.025;
        } else {
            feePercent = 0.02;
        }
        return subtotal.multiply(java.math.BigDecimal.valueOf(feePercent)).setScale(2, java.math.RoundingMode.HALF_UP);
    }


    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        return mapOrderToDTO(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with order number: " + orderNumber));

        return mapOrderToDTO(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDTO> getBuyerOrders(Long buyerId, Pageable pageable) {
        return orderRepository.findByBuyerId(buyerId, pageable)
                .map(this::mapOrderToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDTO> getSellerOrders(Long sellerId, Pageable pageable) {
        return orderRepository.findBySellerId(sellerId, pageable)
                .map(this::mapOrderToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDTO> getOrdersByStatus(String status, Pageable pageable) {
        Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        return orderRepository.findByOrderStatus(orderStatus, pageable)
                .map(this::mapOrderToDTO);
    }

    @Override
    public OrderDTO updateOrderStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            order.setOrderStatus(orderStatus);

            if (Order.OrderStatus.DELIVERED.equals(orderStatus)) {
                order.setActualDeliveryDate(LocalDate.now());
            }

            Order updatedOrder = orderRepository.save(order);

            log.info("Order status updated to {} for order ID: {}", status, id);

            return mapOrderToDTO(updatedOrder);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid order status: " + status);
        }
    }

    @Override
    public OrderDTO cancelOrder(Long id, String reason) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!Order.OrderStatus.PENDING.equals(order.getOrderStatus())) {
            throw new BadRequestException("Only pending orders can be cancelled");
        }

        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        order.setCancellationReason(reason);

        Order cancelledOrder = orderRepository.save(order);

        log.info("Order cancelled with ID: {}", id);

        return mapOrderToDTO(cancelledOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTodayDeliveredOrdersCount() {
        return orderRepository.countTodayDeliveredOrders();
    }

    @Override
    @Transactional(readOnly = true)
    public Double getTotalSalesByMonth(Integer month, Integer year) {
        java.math.BigDecimal total = orderRepository.getTotalSalesByMonth(month, year);
        return total != null ? total.doubleValue() : 0.0;
    }

    @Override
    public OrderDTO updateOrder(Long id, OrderDTO orderDTO) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        order.setShippingAddress(orderDTO.getShippingAddress());
        order.setExpectedDeliveryDate(orderDTO.getExpectedDeliveryDate() != null ? orderDTO.getExpectedDeliveryDate().toLocalDate() : null);

        Order updatedOrder = orderRepository.save(order);

        log.info("Order updated with ID: {}", id);

        return mapOrderToDTO(updatedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO previewOrder(OrderDTO orderDTO) {
        User buyer = userRepository.findById(orderDTO.getBuyerId())
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found"));

        java.util.List<OrderItemDTO> itemDTOs = orderDTO.getOrderItems();
        java.math.BigDecimal subtotal = java.math.BigDecimal.ZERO;
        int totalItemsCount = 0;

        if (itemDTOs != null) {
            for (OrderItemDTO itemDTO : itemDTOs) {
                Product product = productRepository.findById(itemDTO.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemDTO.getProductId()));
                
                java.math.BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
                java.math.BigDecimal itemTotal = unitPrice.multiply(java.math.BigDecimal.valueOf(itemDTO.getQuantity()));
                subtotal = subtotal.add(itemTotal);
                totalItemsCount += itemDTO.getQuantity();
            }
        }

        java.math.BigDecimal platformFee = calculatePlatformFee(subtotal);
        java.math.BigDecimal discount = orderDTO.getDiscountAmount() != null ? orderDTO.getDiscountAmount() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal tax = subtotal.multiply(java.math.BigDecimal.valueOf(0.05)).setScale(2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal shipping = subtotal.compareTo(java.math.BigDecimal.ZERO) > 0 ? java.math.BigDecimal.valueOf(350) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal finalAmount = subtotal.add(tax).add(shipping).add(platformFee).subtract(discount);

        return OrderDTO.builder()
                .buyerId(buyer.getId())
                .buyerName(buyer.getFirstName() + " " + buyer.getLastName())
                .orderItems(itemDTOs)
                .subtotalAmount(subtotal)
                .orderAmount(subtotal)
                .platformFee(platformFee)
                .taxAmount(tax)
                .shippingCharge(shipping)
                .totalAmount(finalAmount)
                .finalAmount(finalAmount)
                .totalItemsCount(totalItemsCount)
                .shippingAddress(orderDTO.getShippingAddress())
                .build();
    }

    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }

    private OrderDTO mapOrderToDTO(Order order) {
        OrderDTO dto = OrderDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .buyerId(order.getBuyer().getId())
                .buyerName(order.getBuyer().getFirstName() + " " + order.getBuyer().getLastName())
                .sellerId(order.getSeller() != null ? order.getSeller().getId() : null)
                .sellerName(order.getSeller() != null ? order.getSeller().getBusinessName() : null)
                .orderStatus(order.getOrderStatus().toString())
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .shippingCharge(order.getShippingCharge())
                .totalAmount(order.getTotalAmount())
                .orderAmount(order.getOrderAmount())
                .platformFee(order.getPlatformFee())
                .sellerAmount(order.getSellerAmount())
                .finalAmount(order.getFinalAmount())
                .shippingAddress(order.getShippingAddress())
                .totalItemsCount(order.getTotalItemsCount())
                .expectedDeliveryDate(order.getExpectedDeliveryDate() != null ? order.getExpectedDeliveryDate().atStartOfDay() : null)
                .actualDeliveryDate(order.getActualDeliveryDate() != null ? order.getActualDeliveryDate().atStartOfDay() : null)
                .cancellationReason(order.getCancellationReason())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();

        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            dto.setOrderItems(order.getOrderItems().stream().map(item -> OrderItemDTO.builder()
                    .id(item.getId())
                    .orderId(order.getId())
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getProductName())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalPrice(item.getTotalPrice())
                    .itemStatus(item.getItemStatus() != null ? item.getItemStatus().toString() : null)
                    .createdAt(item.getCreatedAt())
                    .build()).collect(Collectors.toList()));
        }

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDTO> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable)
                .map(this::mapOrderToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrderByIdSecure(Long id, UserPrincipal principal) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        checkOrderAccess(order, principal);
        return mapOrderToDTO(order);
    }

    @Override
    @Transactional
    public OrderDTO updateOrderStatusSecure(Long id, String status, UserPrincipal principal) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        checkOrderStatusUpdateAccess(order, principal);

        try {
            Order.OrderStatus oldStatus = order.getOrderStatus();
            Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            
            // Robust state-machine transitions validation
            int oldOrdinal = oldStatus.ordinal();
            int newOrdinal = newStatus.ordinal();

            if (newStatus == Order.OrderStatus.CANCELLED) {
                if (oldStatus == Order.OrderStatus.DELIVERED || oldStatus == Order.OrderStatus.RETURNED || oldStatus == Order.OrderStatus.REFUNDED) {
                    throw new BadRequestException("Cannot cancel order once it has been delivered");
                }
            } else if (newStatus == Order.OrderStatus.RETURNED) {
                if (oldStatus != Order.OrderStatus.DELIVERED) {
                    throw new BadRequestException("Only delivered orders can be returned");
                }
            } else if (newStatus == Order.OrderStatus.REFUNDED) {
                if (oldStatus != Order.OrderStatus.DELIVERED && oldStatus != Order.OrderStatus.RETURNED) {
                    throw new BadRequestException("Only delivered or returned orders can be refunded");
                }
            } else {
                // Active progression: PENDING(0), ACCEPTED(1), PACKED(2), SHIPPED(3), OUT_FOR_DELIVERY(4), DELIVERED(5)
                if (oldOrdinal >= 5) {
                    throw new BadRequestException("Cannot transition order from " + oldStatus + " state to " + newStatus);
                }
                if (newOrdinal <= oldOrdinal) {
                    throw new BadRequestException("Cannot transition order backward from " + oldStatus + " to " + newStatus);
                }
            }

            order.setOrderStatus(newStatus);

            if (Order.OrderStatus.DELIVERED.equals(newStatus)) {
                order.setActualDeliveryDate(LocalDate.now());
            }

            Order updatedOrder = orderRepository.save(order);
            log.info("Order status updated to {} for order ID: {}", status, id);

            // Sync with OrderTracking if it exists!
            Optional<OrderTracking> trackingOpt = orderTrackingRepository.findByOrderId(id);
            if (trackingOpt.isPresent()) {
                OrderTracking tracking = trackingOpt.get();
                if (newStatus == Order.OrderStatus.DELIVERED) {
                    tracking.setStatus("DELIVERED");
                    if (tracking.getDeliveryProfile() != null) {
                        DeliveryProfile dp = tracking.getDeliveryProfile();
                        dp.setStatus("AVAILABLE");
                        deliveryProfileRepository.save(dp);
                    }
                } else if (newStatus == Order.OrderStatus.OUT_FOR_DELIVERY) {
                    tracking.setStatus("OUT_FOR_DELIVERY");
                } else if (newStatus == Order.OrderStatus.SHIPPED) {
                    tracking.setStatus("OUT_FOR_DELIVERY".equals(tracking.getStatus()) ? tracking.getStatus() : "ASSIGNED");
                } else if (newStatus == Order.OrderStatus.PACKED) {
                    tracking.setStatus("PACKED");
                } else if (newStatus == Order.OrderStatus.RETURNED) {
                    tracking.setStatus("RETURNED");
                } else if (newStatus == Order.OrderStatus.REFUNDED) {
                    tracking.setStatus("REFUNDED");
                } else if (newStatus == Order.OrderStatus.CANCELLED) {
                    tracking.setStatus("TRACKING_PAUSED");
                    if (tracking.getDeliveryProfile() != null) {
                        DeliveryProfile dp = tracking.getDeliveryProfile();
                        dp.setStatus("AVAILABLE");
                        deliveryProfileRepository.save(dp);
                    }
                }
                orderTrackingRepository.save(tracking);
            }

            // Trigger status change notification
            try {
                String eventType = null;
                String title = null;
                String message = null;
                if (newStatus == Order.OrderStatus.ACCEPTED) {
                    eventType = "ORDER_ACCEPTED";
                    title = "Order Accepted";
                    message = "Your order " + updatedOrder.getOrderNumber() + " has been accepted by the seller.";
                } else if (newStatus == Order.OrderStatus.PACKED) {
                    eventType = "ORDER_PACKED";
                    title = "Order Packed";
                    message = "Your order " + updatedOrder.getOrderNumber() + " has been packed and is ready for shipment.";
                } else if (newStatus == Order.OrderStatus.SHIPPED) {
                    eventType = "ORDER_SHIPPED";
                    title = "Order Shipped";
                    message = "Your order " + updatedOrder.getOrderNumber() + " has been shipped.";
                } else if (newStatus == Order.OrderStatus.OUT_FOR_DELIVERY) {
                    eventType = "OUT_FOR_DELIVERY";
                    title = "Order Out For Delivery";
                    message = "Your order " + updatedOrder.getOrderNumber() + " is out for delivery.";
                } else if (newStatus == Order.OrderStatus.DELIVERED) {
                    eventType = "DELIVERED";
                    title = "Order Delivered";
                    message = "Your order " + updatedOrder.getOrderNumber() + " has been delivered successfully. Thank you for shopping with us!";
                } else if (newStatus == Order.OrderStatus.RETURNED) {
                    eventType = "ORDER_RETURNED";
                    title = "Order Returned";
                    message = "Your order " + updatedOrder.getOrderNumber() + " has been marked as returned.";
                } else if (newStatus == Order.OrderStatus.REFUNDED) {
                    eventType = "ORDER_REFUNDED";
                    title = "Order Refunded";
                    message = "Your order " + updatedOrder.getOrderNumber() + " has been refunded.";
                } else if (newStatus == Order.OrderStatus.CANCELLED) {
                    eventType = "ORDER_CANCELLED";
                    title = "Order Cancelled";
                    message = "Your order " + updatedOrder.getOrderNumber() + " has been cancelled.";
                }
                
                if (eventType != null) {
                    notificationService.sendEventNotification(
                        updatedOrder.getBuyer(),
                        eventType,
                        title,
                        message,
                        "ORDER",
                        updatedOrder.getId().toString()
                    );
                }
            } catch (Exception ex) {
                log.error("Failed to send order status notification for order ID: {}", updatedOrder.getId(), ex);
            }

            return mapOrderToDTO(updatedOrder);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid order status: " + status);
        }
    }

    @Override
    @Transactional
    public OrderDTO cancelOrderSecure(Long id, String reason, UserPrincipal principal) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        checkOrderAccess(order, principal);

        Order.OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus == Order.OrderStatus.SHIPPED ||
            currentStatus == Order.OrderStatus.OUT_FOR_DELIVERY ||
            currentStatus == Order.OrderStatus.DELIVERED ||
            currentStatus == Order.OrderStatus.RETURNED ||
            currentStatus == Order.OrderStatus.REFUNDED ||
            currentStatus == Order.OrderStatus.CANCELLED) {
            throw new BadRequestException("Order cannot be cancelled in status: " + currentStatus);
        }

        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        order.setCancellationReason(reason);
        order.setCancelledAt(LocalDateTime.now());

        // Refund stock if cancelled
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            if (product.getInventory() != null) {
                ProductInventory inventory = product.getInventory();
                inventory.setQuantityAvailable(inventory.getQuantityAvailable() + item.getQuantity());
                inventory.setQuantitySold(Math.max(0, inventory.getQuantitySold() - item.getQuantity()));
            }
        }

        Order cancelledOrder = orderRepository.save(order);
        log.info("Order cancelled with ID: {}", id);

        // Sync with OrderTracking if it exists!
        Optional<OrderTracking> trackingOpt = orderTrackingRepository.findByOrderId(id);
        if (trackingOpt.isPresent()) {
            OrderTracking tracking = trackingOpt.get();
            tracking.setStatus("TRACKING_PAUSED");
            if (tracking.getDeliveryProfile() != null) {
                DeliveryProfile dp = tracking.getDeliveryProfile();
                dp.setStatus("AVAILABLE");
                deliveryProfileRepository.save(dp);
            }
            orderTrackingRepository.save(tracking);
        }

        return mapOrderToDTO(cancelledOrder);
    }

    @Override
    @Transactional
    public OrderDTO returnOrderSecure(Long id, String reason, UserPrincipal principal) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        checkOrderAccess(order, principal);

        Order.OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus != Order.OrderStatus.DELIVERED) {
            throw new BadRequestException("Only delivered orders can be returned");
        }

        order.setOrderStatus(Order.OrderStatus.RETURNED);
        order.setCancellationReason("Return requested: " + reason);

        // Sync with OrderTracking if it exists!
        Optional<OrderTracking> trackingOpt = orderTrackingRepository.findByOrderId(id);
        if (trackingOpt.isPresent()) {
            OrderTracking tracking = trackingOpt.get();
            tracking.setStatus("RETURNED");
            orderTrackingRepository.save(tracking);
        }

        Order returnedOrder = orderRepository.save(order);
        log.info("Order returned with ID: {}", id);

        // Trigger notification
        try {
            notificationService.sendEventNotification(
                returnedOrder.getBuyer(),
                "ORDER_RETURNED",
                "Order Return Requested",
                "Your order " + returnedOrder.getOrderNumber() + " return request was submitted successfully.",
                "ORDER",
                returnedOrder.getId().toString()
            );
        } catch (Exception ex) {
            log.error("Failed to send ORDER_RETURNED notification for order ID: {}", returnedOrder.getId(), ex);
        }

        return mapOrderToDTO(returnedOrder);
    }

    private void checkOrderAccess(Order order, UserPrincipal principal) {
        if (isAdmin(principal)) {
            return;
        }
        if (order.getBuyer().getId().equals(principal.getId())) {
            return;
        }
        if (order.getSeller() != null && order.getSeller().getUser().getId().equals(principal.getId())) {
            return;
        }
        throw new AccessDeniedException("You are not authorized to access this order");
    }

    private void checkOrderStatusUpdateAccess(Order order, UserPrincipal principal) {
        if (isAdmin(principal)) {
            return;
        }
        if (order.getSeller() != null && order.getSeller().getUser().getId().equals(principal.getId())) {
            return;
        }
        throw new AccessDeniedException("You are not authorized to update this order");
    }

    private boolean isAdmin(UserPrincipal principal) {
        if (principal == null) return false;
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}

