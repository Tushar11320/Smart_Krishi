package com.smartkrishi.repository;

import com.smartkrishi.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByOrderId(Long orderId);
    
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    
    Page<Payment> findByOrderBuyerId(Long buyerId, Pageable pageable);
    
    Page<Payment> findByPaymentStatus(Payment.PaymentStatus paymentStatus, Pageable pageable);
}
