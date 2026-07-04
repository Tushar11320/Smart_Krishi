package com.smartkrishi.service.payment;

import com.smartkrishi.dto.payment.PaymentDTO;
import com.smartkrishi.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {
    PaymentDTO createPayment(PaymentDTO paymentDTO);
    PaymentDTO getPaymentById(Long id);
    PaymentDTO getPaymentByOrderId(Long orderId);
    PaymentDTO getPaymentByTransactionId(String transactionId);
    PaymentDTO getPaymentByIdSecure(Long id, UserPrincipal userPrincipal);
    PaymentDTO getPaymentByOrderIdSecure(Long orderId, UserPrincipal userPrincipal);
    PaymentDTO getPaymentByTransactionIdSecure(String transactionId, UserPrincipal userPrincipal);
    Page<PaymentDTO> getUserPayments(Long userId, Pageable pageable);
    Page<PaymentDTO> getPaymentsByStatus(String status, Pageable pageable);
    PaymentDTO updatePaymentStatus(Long id, String status);
    PaymentDTO updatePaymentStatusSecure(Long id, String status, UserPrincipal userPrincipal);
    PaymentDTO verifyPayment(Long id, String transactionId);
    PaymentDTO verifyPayment(Long id, String transactionId, String signature);
    PaymentDTO processRefund(Long id, String reason);
    void handleWebhook(String payload, String signature);
    
    boolean isCodEnabled();
    void setCodEnabled(boolean enabled);
    boolean isBankTransferEnabled();
    void setBankTransferEnabled(boolean enabled);
}

