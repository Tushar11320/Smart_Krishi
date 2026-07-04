package com.smartkrishi.repository;

import com.smartkrishi.entity.OrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {
    Optional<OrderTracking> findByOrderId(Long orderId);
}
