package com.smartkrishi.repository;

import com.smartkrishi.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    Optional<Order> findByOrderNumber(String orderNumber);
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    Page<Order> findByBuyerId(Long buyerId, Pageable pageable);
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    Page<Order> findByBuyerIdAndOrderStatus(Long buyerId, Order.OrderStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    Page<Order> findBySellerId(Long sellerId, Pageable pageable);
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    List<Order> findBySellerId(Long sellerId);
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    Page<Order> findBySellerIdAndOrderStatus(Long sellerId, Order.OrderStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    @Query("SELECT o FROM Order o WHERE o.buyer.id = :buyerId AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    Page<Order> findByBuyerIdAndDateRange(@Param("buyerId") Long buyerId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = 'DELIVERED' AND CAST(o.updatedAt AS DATE) = CAST(CURRENT_DATE AS DATE)")
    Long countTodayDeliveredOrders();
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.orderStatus = 'DELIVERED' AND MONTH(o.createdAt) = :month AND YEAR(o.createdAt) = :year")
    java.math.BigDecimal getTotalSalesByMonth(@Param("month") Integer month, @Param("year") Integer year);
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    List<Order> findByOrderStatusIn(List<Order.OrderStatus> statuses);
    
    @EntityGraph(attributePaths = {"orderItems", "payment"})
    Page<Order> findByOrderStatus(Order.OrderStatus status, Pageable pageable);

    Long countBySellerId(Long sellerId);

    Long countBySellerIdAndOrderStatus(Long sellerId, Order.OrderStatus status);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.seller.id = :sellerId AND o.orderStatus = 'DELIVERED'")
    java.math.BigDecimal sumTotalAmountBySellerIdAndOrderStatusDelivered(@Param("sellerId") Long sellerId);

    @Query("SELECT MONTH(o.createdAt) as monthVal, SUM(o.totalAmount) as salesSum FROM Order o WHERE o.seller.id = :sellerId AND o.orderStatus = 'DELIVERED' AND YEAR(o.createdAt) = :year GROUP BY MONTH(o.createdAt)")
    List<Object[]> getMonthlySalesBySellerIdAndYear(@Param("sellerId") Long sellerId, @Param("year") Integer year);

    @EntityGraph(attributePaths = {"orderItems", "payment"})
    @Query("SELECT o FROM Order o WHERE o.payment IS NOT NULL AND o.payment.paymentStatus = com.smartkrishi.entity.Payment.PaymentStatus.SUCCESS")
    List<Order> findPaidOrders();

    boolean existsByBuyerIdAndSellerIdAndOrderStatus(Long buyerId, Long sellerId, Order.OrderStatus status);
}
