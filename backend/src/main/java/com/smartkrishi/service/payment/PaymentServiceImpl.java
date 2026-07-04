package com.smartkrishi.service.payment;

import com.smartkrishi.dto.payment.PaymentDTO;
import com.smartkrishi.entity.Order;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.entity.Payment;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.OrderRepository;
import com.smartkrishi.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final com.smartkrishi.service.notification.NotificationService notificationService;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook-secret}")
    private String razorpayWebhookSecret;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    private boolean codEnabled = true;
    private boolean bankTransferEnabled = true;

    @PostConstruct
    public void init() {
        if ("prod".equalsIgnoreCase(activeProfile)) {
            if (razorpayKeyId == null || razorpayKeyId.trim().isEmpty() || razorpayKeyId.equals("key_id") || razorpayKeyId.equals("your-key-id")) {
                throw new IllegalStateException("Production deployment blocker: razorpay.key-id must be set in prod profile.");
            }
            if (razorpayKeySecret == null || razorpayKeySecret.trim().isEmpty() || razorpayKeySecret.equals("key_secret") || razorpayKeySecret.equals("your-key-secret")) {
                throw new IllegalStateException("Production deployment blocker: razorpay.key-secret must be set in prod profile.");
            }
            if (razorpayWebhookSecret == null || razorpayWebhookSecret.trim().isEmpty() || razorpayWebhookSecret.equals("webhook-secret") || razorpayWebhookSecret.equals("your-webhook-secret") || razorpayWebhookSecret.equals("webhook_secret")) {
                throw new IllegalStateException("Production deployment blocker: razorpay.webhook-secret must be set in prod profile.");
            }
        }
    }

    public PaymentServiceImpl(PaymentRepository paymentRepository, OrderRepository orderRepository, com.smartkrishi.service.notification.NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public PaymentDTO createPayment(PaymentDTO paymentDTO) {
        Order order = orderRepository.findById(paymentDTO.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", paymentDTO.getOrderId()));

        // Check if payment already exists for this order
        java.util.Optional<Payment> existingPaymentOpt = paymentRepository.findByOrderId(order.getId());
        Payment payment;
        if (existingPaymentOpt.isPresent()) {
            payment = existingPaymentOpt.get();
            if (payment.getPaymentStatus() == Payment.PaymentStatus.SUCCESS) {
                throw new BadRequestException("Payment has already been successfully completed for order: " + order.getOrderNumber());
            }
            if (payment.getPaymentStatus() == Payment.PaymentStatus.REFUNDED) {
                throw new BadRequestException("Payment for this order has been refunded: " + order.getOrderNumber());
            }
            log.info("Payment record already exists for order {} in status {}. Retrying/re-initiating...", order.getOrderNumber(), payment.getPaymentStatus());
            payment.setPaymentStatus(Payment.PaymentStatus.INITIATED);
        } else {
            payment = new Payment();
            payment.setOrder(order);
            payment.setBuyer(order.getBuyer());
            payment.setPaymentMethod(paymentDTO.getPaymentMethod() != null ? paymentDTO.getPaymentMethod() : "RAZORPAY");
            payment.setPlatformFee(order.getPlatformFee() != null ? order.getPlatformFee() : java.math.BigDecimal.ZERO);
            payment.setCurrency("INR");
            payment.setPaymentStatus(Payment.PaymentStatus.INITIATED);
        }

        // Amount must be strictly validated server-side to prevent client amount manipulation.
        // It must always match the Order's total amount!
        BigDecimal paymentAmount = order.getTotalAmount();
        payment.setAmount(paymentAmount);

        boolean isProd = "prod".equalsIgnoreCase(activeProfile);
        String razorpayOrderId = null;
        try {
            if (razorpayKeyId != null && !razorpayKeyId.equals("key_id") && !razorpayKeyId.equals("your-key-id") && !razorpayKeyId.trim().isEmpty()) {
                log.info("Attempting to connect to Razorpay to create order for amount: {}", paymentAmount);
                RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                
                JSONObject orderRequest = new JSONObject();
                // Razorpay expects amount in paise (1 INR = 100 paise). Safe conversion to long to prevent integer overflow.
                BigDecimal amountInPaise = paymentAmount.multiply(new BigDecimal(100));
                orderRequest.put("amount", amountInPaise.longValue());
                orderRequest.put("currency", payment.getCurrency());
                orderRequest.put("receipt", "txn_" + order.getOrderNumber());
                
                com.razorpay.Order razorpayOrder = client.orders.create(orderRequest);
                if (razorpayOrder != null && razorpayOrder.has("id")) {
                    razorpayOrderId = razorpayOrder.get("id").toString();
                    log.info("Successfully created authentic Razorpay Order ID: {}", razorpayOrderId);
                }
            } else {
                log.warn("Using placeholder credentials (" + razorpayKeyId + "). Skipping Razorpay API order creation.");
                if (isProd) {
                    throw new BadRequestException("Razorpay API order creation is required in production but placeholder credentials were used.");
                }
            }
        } catch (Exception e) {
            log.error("Error calling Razorpay API. Falling back to local ID generator.", e);
            if (isProd) {
                throw new BadRequestException("Razorpay API integration failure: " + e.getMessage());
            }
        }

        if (razorpayOrderId == null) {
            if (payment.getRazorpayOrderId() != null) {
                razorpayOrderId = payment.getRazorpayOrderId();
            } else {
                razorpayOrderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            }
            log.info("Using Razorpay order ID: {}", razorpayOrderId);
        }

        payment.setRazorpayOrderId(razorpayOrderId);
        Payment saved = paymentRepository.save(payment);
        return mapToDTO(saved);
    }

    @Override
    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        return mapToDTO(payment);
    }

    @Override
    public PaymentDTO getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));
        return mapToDTO(payment);
    }

    @Override
    public PaymentDTO getPaymentByTransactionId(String transactionId) {
        Payment payment = paymentRepository.findByRazorpayPaymentId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "transactionId", transactionId));
        return mapToDTO(payment);
    }

    @Override
    public Page<PaymentDTO> getUserPayments(Long userId, Pageable pageable) {
        return paymentRepository.findByOrderBuyerId(userId, pageable).map(this::mapToDTO);
    }

    @Override
    public Page<PaymentDTO> getPaymentsByStatus(String status, Pageable pageable) {
        Payment.PaymentStatus paymentStatus = Payment.PaymentStatus.valueOf(status.toUpperCase());
        return paymentRepository.findByPaymentStatus(paymentStatus, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional
    public PaymentDTO updatePaymentStatus(Long id, String status) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        payment.setPaymentStatus(Payment.PaymentStatus.valueOf(status.toUpperCase()));
        Payment updated = paymentRepository.save(payment);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public PaymentDTO updatePaymentStatusSecure(Long id, String status, UserPrincipal userPrincipal) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        
        boolean isAdmin = userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        
        if (!isAdmin) {
            if (payment.getBuyer() == null || !payment.getBuyer().getId().equals(userPrincipal.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You are not authorized to update this payment");
            }
            if (!status.equalsIgnoreCase("FAILED")) {
                throw new org.springframework.security.access.AccessDeniedException("Buyers can only set payment status to FAILED");
            }
        }
        
        payment.setPaymentStatus(Payment.PaymentStatus.valueOf(status.toUpperCase()));
        Payment updated = paymentRepository.save(payment);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public PaymentDTO verifyPayment(Long id, String transactionId) {
        return verifyPayment(id, transactionId, null);
    }

    @Override
    @Transactional
    public PaymentDTO verifyPayment(Long id, String transactionId, String signature) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));

        // Validate BOLA / Ownership
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof com.smartkrishi.security.UserPrincipal)) {
            throw new org.springframework.security.access.AccessDeniedException("User must be authenticated to verify payment");
        }
        com.smartkrishi.security.UserPrincipal principal = (com.smartkrishi.security.UserPrincipal) auth.getPrincipal();

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin) {
            if (payment.getBuyer() == null || !payment.getBuyer().getId().equals(principal.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You are not authorized to verify this payment");
            }
        }

        Order order = payment.getOrder();

        if (payment.getPaymentStatus() == Payment.PaymentStatus.SUCCESS) {
            log.info("Payment ID: {} is already SUCCESS. Skipping verification.", id);
            return mapToDTO(payment);
        }

        // Bypassing signature verification for offline payment methods (COD, BANK_TRANSFER)
        boolean isOffline = "COD".equalsIgnoreCase(payment.getPaymentMethod()) || 
                            "CASH_ON_DELIVERY".equalsIgnoreCase(payment.getPaymentMethod()) || 
                            "BANK_TRANSFER".equalsIgnoreCase(payment.getPaymentMethod());

        if (isOffline) {
            log.info("Bypassing Razorpay signature verification for offline payment method: {}", payment.getPaymentMethod());
            payment.setRazorpayPaymentId(transactionId != null ? transactionId : "offline_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
            payment.setTransactionId(payment.getRazorpayPaymentId());
            payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            
            // Build json response for offline payment to store in gatewayResponse
            org.json.JSONObject offlineResponse = new org.json.JSONObject();
            offlineResponse.put("method", payment.getPaymentMethod());
            offlineResponse.put("status", "SUCCESS");
            offlineResponse.put("amount", payment.getAmount());
            offlineResponse.put("orderId", order != null ? order.getId() : null);
            offlineResponse.put("verifiedOffline", true);
            payment.setGatewayResponse(offlineResponse.toString());

            if (order != null && order.getOrderStatus() == Order.OrderStatus.PENDING) {
                order.setOrderStatus(Order.OrderStatus.ACCEPTED);
                orderRepository.save(order);
                log.info("Associated order status updated to ACCEPTED for offline order: {}", order.getOrderNumber());
            }

            Payment updated = paymentRepository.save(payment);
            sendPaymentNotification(updated, "PAYMENT_SUCCESS", "Order Placed Successfully", 
                "Your order " + (order != null ? order.getOrderNumber() : "") + " has been placed using " + payment.getPaymentMethod() + ".");
            return mapToDTO(updated);
        }

        // Prevent replay attacks: check if transactionId has already been used in another success payment
        if (transactionId != null && !transactionId.trim().isEmpty()) {
            java.util.Optional<Payment> existingWithTxn = paymentRepository.findByRazorpayPaymentId(transactionId);
            if (existingWithTxn.isPresent() && !existingWithTxn.get().getId().equals(id) && existingWithTxn.get().getPaymentStatus() == Payment.PaymentStatus.SUCCESS) {
                throw new BadRequestException("This payment transaction has already been processed for another order.");
            }
        }

        // Validate cryptographic signature: strictly mandatory if keys are live
        boolean isProd = "prod".equalsIgnoreCase(activeProfile);
        boolean isMockKey = !isProd && (razorpayKeySecret == null || razorpayKeySecret.equals("key_secret") || razorpayKeySecret.equals("your-key-secret") || razorpayKeySecret.trim().isEmpty());
        boolean isMockSignature = signature != null && (signature.startsWith("sig_sim_") || signature.startsWith("mock_"));

        if (isProd || !isMockKey) {
            if (signature == null || signature.trim().isEmpty() || isMockSignature) {
                payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
                payment.setFailureReason("Cryptographic signature is required and mock signatures are rejected in live environments.");
                paymentRepository.save(payment);
                throw new BadRequestException("Cryptographic signature is required for live payments");
            }
            
            boolean isValid = verifyRazorpaySignature(payment.getRazorpayOrderId(), transactionId, signature);
            if (!isValid) {
                log.error("Razorpay signature validation failed for payment ID: {}, Signature: {}", id, signature);
                payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
                payment.setFailureReason("Invalid cryptographic signature");
                Payment saved = paymentRepository.save(payment);
                sendPaymentNotification(saved, "PAYMENT_FAILURE", "Payment Failed", "Payment of Rs. " + saved.getAmount() + " for order " + (order != null ? order.getOrderNumber() : "") + " failed: Invalid cryptographic signature.");
                throw new BadRequestException("Invalid payment signature");
            }
            log.info("Razorpay signature successfully verified for payment ID: {}", id);
        } else {
            log.warn("Skipping signature verification because key is mock (isMockKey=true).");
        }

        payment.setRazorpayPaymentId(transactionId);
        payment.setTransactionId(transactionId);
        payment.setRazorpaySignature(signature);
        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());

        // Build json response for online payment to store in gatewayResponse
        org.json.JSONObject onlineResponse = new org.json.JSONObject();
        onlineResponse.put("razorpay_payment_id", transactionId);
        onlineResponse.put("razorpay_order_id", payment.getRazorpayOrderId());
        onlineResponse.put("razorpay_signature", signature);
        onlineResponse.put("status", "SUCCESS");
        onlineResponse.put("is_mock", isMockKey);
        payment.setGatewayResponse(onlineResponse.toString());

        // Update order status to ACCEPTED
        if (order != null && order.getOrderStatus() == Order.OrderStatus.PENDING) {
            order.setOrderStatus(Order.OrderStatus.ACCEPTED);
            orderRepository.save(order);
            log.info("Associated order status updated to ACCEPTED for order number: {}", order.getOrderNumber());
        }

        log.info("Payment {} verified and marked as SUCCESS with transaction ID: {}", id, transactionId);
        Payment updated = paymentRepository.save(payment);
        sendPaymentNotification(updated, "PAYMENT_SUCCESS", "Payment Successful", "Payment of Rs. " + updated.getAmount() + " for order " + order.getOrderNumber() + " was successful.");
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public PaymentDTO processRefund(Long id, String reason) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));

        if (payment.getPaymentStatus() != Payment.PaymentStatus.SUCCESS) {
            throw new BadRequestException("Only completed payments can be refunded. Current status: " + payment.getPaymentStatus());
        }

        // Call Razorpay API to process refund
        boolean isMockKey = razorpayKeySecret == null || razorpayKeySecret.equals("key_secret") || razorpayKeySecret.equals("your-key-secret");
        if (!isMockKey && payment.getRazorpayPaymentId() != null && !payment.getRazorpayPaymentId().startsWith("pay_sim_")) {
            try {
                RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                JSONObject refundRequest = new JSONObject();
                BigDecimal amountInPaise = payment.getAmount().multiply(new BigDecimal(100));
                refundRequest.put("amount", amountInPaise.longValue());
                refundRequest.put("speed", "optimum");
                
                com.razorpay.Refund refund = client.payments.refund(payment.getRazorpayPaymentId(), refundRequest);
                if (refund != null) {
                    Object refundIdObj = refund.get("id");
                    String refundId = refundIdObj != null ? refundIdObj.toString() : "unknown";
                    log.info("Successfully processed Razorpay Refund. Refund ID: {}", refundId);
                }
            } catch (Exception e) {
                log.error("Failed to process Razorpay refund through SDK", e);
                throw new BadRequestException("Razorpay refund failed: " + e.getMessage());
            }
        } else {
            log.warn("Skipping live Razorpay API refund call because keys are mock or transaction is mock.");
        }

        payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
        payment.setFailureReason("Refund: " + reason);

        // Update order status
        Order order = payment.getOrder();
        if (order != null) {
            if (order.getOrderStatus() == Order.OrderStatus.RETURNED || order.getOrderStatus() == Order.OrderStatus.DELIVERED) {
                order.setOrderStatus(Order.OrderStatus.REFUNDED);
            } else {
                order.setOrderStatus(Order.OrderStatus.CANCELLED);
            }
            order.setCancellationReason(reason);
            order.setCancelledAt(LocalDateTime.now());
            orderRepository.save(order);
        }

        log.info("Payment {} refunded. Reason: {}", id, reason);
        Payment updated = paymentRepository.save(payment);
        sendPaymentNotification(updated, "REFUNDS", "Refund Processed", "Refund of Rs. " + updated.getAmount() + " for order " + order.getOrderNumber() + " has been successfully processed.");
        return mapToDTO(updated);
    }

    private boolean verifyRazorpaySignature(String orderId, String paymentId, String signature) {
        try {
            String data = orderId + "|" + paymentId;
            javax.crypto.Mac sha256_HMAC = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secret_key = new javax.crypto.spec.SecretKeySpec(
                    razorpayKeySecret.getBytes("UTF-8"), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(data.getBytes("UTF-8"));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equals(signature);
        } catch (Exception e) {
            log.error("Failed to verify Razorpay signature", e);
            return false;
        }
    }

    private PaymentDTO mapToDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .orderNumber(payment.getOrder() != null ? payment.getOrder().getOrderNumber() : null)
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus() != null ? payment.getPaymentStatus().name() : null)
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayKeyId(razorpayKeyId)
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .razorpaySignature(payment.getRazorpaySignature())
                .amount(payment.getAmount())
                .platformFee(payment.getPlatformFee())
                .currency(payment.getCurrency())
                .gatewayResponse(payment.getGatewayResponse())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void handleWebhook(String payload, String signature) {
        log.info("Received Razorpay Webhook. Payload length: {}, Signature: {}", payload.length(), signature);

        // Verify webhook signature: strictly mandatory if keys are live
        boolean isProd = "prod".equalsIgnoreCase(activeProfile);
        boolean isMockKey = !isProd && (razorpayWebhookSecret == null || razorpayWebhookSecret.equals("webhook_secret") || razorpayWebhookSecret.equals("your-webhook-secret") || razorpayWebhookSecret.trim().isEmpty());
        boolean isMockSignature = signature != null && (signature.startsWith("sig_sim_") || signature.startsWith("mock_"));
        
        if (isProd || !isMockKey) {
            if (signature == null || signature.trim().isEmpty() || isMockSignature) {
                log.error("Webhook rejected: signature is required and mock signatures are forbidden in live environments.");
                throw new BadRequestException("Cryptographic signature is required for live webhooks");
            }
            try {
                boolean isValid = com.razorpay.Utils.verifyWebhookSignature(payload, signature, razorpayWebhookSecret);
                if (!isValid) {
                    log.error("Webhook signature verification failed.");
                    throw new BadRequestException("Invalid webhook signature");
                }
                log.info("Webhook signature successfully verified.");
            } catch (Exception e) {
                log.error("Error verifying webhook signature", e);
                throw new BadRequestException("Failed to verify webhook signature: " + e.getMessage());
            }
        } else {
            log.warn("Skipping webhook signature verification because key is mock (isMockKey=true).");
        }

        // Parse event
        JSONObject event = new JSONObject(payload);
        String eventName = event.optString("event");
        JSONObject payloadObj = event.optJSONObject("payload");
        if (payloadObj == null) {
            log.warn("Webhook event payload is null. Skipping.");
            return;
        }

        if ("payment.captured".equals(eventName) || "order.paid".equals(eventName)) {
            JSONObject paymentObj = payloadObj.optJSONObject("payment");
            JSONObject entityObj = paymentObj != null ? paymentObj.optJSONObject("entity") : null;
            if (entityObj == null) {
                log.warn("Payment entity object is null in webhook payload. Skipping.");
                return;
            }

            String razorpayOrderId = entityObj.optString("order_id");
            String razorpayPaymentId = entityObj.optString("id");
            String method = entityObj.optString("method");
            
            if (razorpayOrderId != null && !razorpayOrderId.isEmpty()) {
                java.util.Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
                if (paymentOpt.isPresent()) {
                    Payment payment = paymentOpt.get();
                    if (payment.getPaymentStatus() != Payment.PaymentStatus.SUCCESS) {
                        log.info("Webhook updating Payment ID: {} for Order {} to SUCCESS via webhook event: {}", payment.getId(), payment.getOrder().getOrderNumber(), eventName);
                        
                        // Prevent replay attack check inside webhook too
                        if (razorpayPaymentId != null) {
                            java.util.Optional<Payment> existingWithTxn = paymentRepository.findByRazorpayPaymentId(razorpayPaymentId);
                            if (existingWithTxn.isPresent() && !existingWithTxn.get().getId().equals(payment.getId()) && existingWithTxn.get().getPaymentStatus() == Payment.PaymentStatus.SUCCESS) {
                                log.warn("Webhook duplicate transaction ID check triggered. Skipping to prevent duplicate payment.");
                                return;
                            }
                        }

                        payment.setRazorpayPaymentId(razorpayPaymentId);
                        payment.setTransactionId(razorpayPaymentId);
                        payment.setPaymentMethod(method);
                        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
                        payment.setPaidAt(LocalDateTime.now());
                        Payment savedPayment = paymentRepository.save(payment);

                        Order order = savedPayment.getOrder();
                        if (order != null && order.getOrderStatus() == Order.OrderStatus.PENDING) {
                            order.setOrderStatus(Order.OrderStatus.ACCEPTED);
                            orderRepository.save(order);
                            log.info("Webhook updated Order ID: {} status to ACCEPTED", order.getId());
                        }
                        sendPaymentNotification(savedPayment, "PAYMENT_SUCCESS", "Payment Successful", "Payment of Rs. " + savedPayment.getAmount() + " for order " + (order != null ? order.getOrderNumber() : "") + " was successful.");
                    } else {
                        log.info("Payment ID: {} is already SUCCESS. Webhook action ignored.", payment.getId());
                    }
                } else {
                    log.warn("No Payment record found for Razorpay Order ID: {}", razorpayOrderId);
                }
            }
        } else if ("payment.failed".equals(eventName)) {
            JSONObject paymentObj = payloadObj.optJSONObject("payment");
            JSONObject entityObj = paymentObj != null ? paymentObj.optJSONObject("entity") : null;
            if (entityObj != null) {
                String razorpayOrderId = entityObj.optString("order_id");
                String errorDescription = entityObj.optString("error_description", "Payment failed");
                if (razorpayOrderId != null && !razorpayOrderId.isEmpty()) {
                    java.util.Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
                    if (paymentOpt.isPresent()) {
                        Payment payment = paymentOpt.get();
                        if (payment.getPaymentStatus() == Payment.PaymentStatus.INITIATED) {
                            log.info("Webhook updating Payment ID: {} to FAILED. Reason: {}", payment.getId(), errorDescription);
                            payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
                            payment.setFailureReason(errorDescription);
                            Payment savedPayment = paymentRepository.save(payment);
                            sendPaymentNotification(savedPayment, "PAYMENT_FAILURE", "Payment Failed", "Payment of Rs. " + savedPayment.getAmount() + " for order " + (savedPayment.getOrder() != null ? savedPayment.getOrder().getOrderNumber() : "") + " failed: " + errorDescription);
                        }
                    }
                }
            }
        } else if ("refund.processed".equals(eventName)) {
            JSONObject refundObj = payloadObj.optJSONObject("refund");
            JSONObject entityObj = refundObj != null ? refundObj.optJSONObject("entity") : null;
            if (entityObj != null) {
                String razorpayPaymentId = entityObj.optString("payment_id");
                if (razorpayPaymentId != null && !razorpayPaymentId.isEmpty()) {
                    java.util.Optional<Payment> paymentOpt = paymentRepository.findByRazorpayPaymentId(razorpayPaymentId);
                    if (paymentOpt.isPresent()) {
                        Payment payment = paymentOpt.get();
                        if (payment.getPaymentStatus() == Payment.PaymentStatus.SUCCESS) {
                            log.info("Webhook updating Payment ID: {} to REFUNDED via refund.processed event", payment.getId());
                            payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
                            Payment savedPayment = paymentRepository.save(payment);

                            Order order = savedPayment.getOrder();
                            if (order != null && order.getOrderStatus() != Order.OrderStatus.CANCELLED) {
                                order.setOrderStatus(Order.OrderStatus.CANCELLED);
                                order.setCancellationReason("Refund processed via webhook");
                                order.setCancelledAt(LocalDateTime.now());
                                orderRepository.save(order);
                            }
                            sendPaymentNotification(savedPayment, "REFUNDS", "Refund Processed", "Refund of Rs. " + savedPayment.getAmount() + " for order " + (order != null ? order.getOrderNumber() : "") + " has been successfully processed.");
                        }
                    }
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDTO getPaymentByIdSecure(Long id, UserPrincipal userPrincipal) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        checkPaymentAccess(payment, userPrincipal);
        return mapToDTO(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDTO getPaymentByOrderIdSecure(Long orderId, UserPrincipal userPrincipal) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));
        checkPaymentAccess(payment, userPrincipal);
        return mapToDTO(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDTO getPaymentByTransactionIdSecure(String transactionId, UserPrincipal userPrincipal) {
        Payment payment = paymentRepository.findByRazorpayPaymentId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "transactionId", transactionId));
        checkPaymentAccess(payment, userPrincipal);
        return mapToDTO(payment);
    }

    private void checkPaymentAccess(Payment payment, UserPrincipal principal) {
        if (isAdmin(principal)) {
            return;
        }
        if (payment.getBuyer() != null && payment.getBuyer().getId().equals(principal.getId())) {
            return;
        }
        if (payment.getOrder() != null && payment.getOrder().getSeller() != null &&
            payment.getOrder().getSeller().getUser().getId().equals(principal.getId())) {
            return;
        }
        throw new org.springframework.security.access.AccessDeniedException("You are not authorized to access this payment");
    }

    private boolean isAdmin(UserPrincipal principal) {
        if (principal == null) return false;
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    private void sendPaymentNotification(Payment payment, String eventType, String title, String message) {
        try {
            if (payment.getBuyer() != null) {
                notificationService.sendEventNotification(
                    payment.getBuyer(),
                    eventType,
                    title,
                    message,
                    "PAYMENT",
                    payment.getId().toString()
                );
            }
        } catch (Exception e) {
            log.error("Failed to send payment notification for payment ID: {}", payment.getId(), e);
        }
    }

    @Override
    public boolean isCodEnabled() {
        return this.codEnabled;
    }

    @Override
    public void setCodEnabled(boolean enabled) {
        this.codEnabled = enabled;
    }

    @Override
    public boolean isBankTransferEnabled() {
        return this.bankTransferEnabled;
    }

    @Override
    public void setBankTransferEnabled(boolean enabled) {
        this.bankTransferEnabled = enabled;
    }
}

