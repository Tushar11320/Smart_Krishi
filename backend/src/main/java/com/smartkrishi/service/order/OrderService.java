package com.smartkrishi.service.order;

import com.smartkrishi.dto.order.OrderDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface OrderService {
    
    OrderDTO createOrder(OrderDTO orderDTO);
    
    OrderDTO getOrderById(Long id);
    
    OrderDTO getOrderByOrderNumber(String orderNumber);
    
    Page<OrderDTO> getBuyerOrders(Long buyerId, Pageable pageable);
    
    Page<OrderDTO> getSellerOrders(Long sellerId, Pageable pageable);
    
    Page<OrderDTO> getOrdersByStatus(String status, Pageable pageable);
    
    OrderDTO updateOrderStatus(Long id, String status);
    
    OrderDTO cancelOrder(Long id, String reason);
    
    Long getTodayDeliveredOrdersCount();
    
    Double getTotalSalesByMonth(Integer month, Integer year);
    
    OrderDTO previewOrder(OrderDTO orderDTO);
    
    OrderDTO updateOrder(Long id, OrderDTO orderDTO);

    Page<OrderDTO> getAllOrders(Pageable pageable);
    
    OrderDTO getOrderByIdSecure(Long id, com.smartkrishi.security.UserPrincipal principal);
    
    OrderDTO updateOrderStatusSecure(Long id, String status, com.smartkrishi.security.UserPrincipal principal);
    
    OrderDTO cancelOrderSecure(Long id, String reason, com.smartkrishi.security.UserPrincipal principal);
    
    OrderDTO returnOrderSecure(Long id, String reason, com.smartkrishi.security.UserPrincipal principal);
}

