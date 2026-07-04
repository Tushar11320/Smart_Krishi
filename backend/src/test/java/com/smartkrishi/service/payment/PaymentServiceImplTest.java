package com.smartkrishi.service.payment;

import com.smartkrishi.dto.payment.PaymentDTO;
import com.smartkrishi.entity.Order;
import com.smartkrishi.entity.Payment;
import com.smartkrishi.entity.User;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.repository.OrderRepository;
import com.smartkrishi.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private User buyer;
    private Order order;
    private Payment payment;

    @BeforeEach
    public void setUp() {
        // Set mock properties
        ReflectionTestUtils.setField(paymentService, "razorpayKeyId", "key_id");
        ReflectionTestUtils.setField(paymentService, "razorpayKeySecret", "key_secret");
        ReflectionTestUtils.setField(paymentService, "razorpayWebhookSecret", "webhook_secret");

        buyer = new User();
        buyer.setId(10L);
        buyer.setEmail("buyer@smartkrishi.com");

        order = new Order();
        order.setId(100L);
        order.setOrderNumber("ORD-99999");
        order.setBuyer(buyer);
        order.setTotalAmount(BigDecimal.valueOf(1500));
        order.setPlatformFee(BigDecimal.valueOf(50));
        order.setOrderStatus(Order.OrderStatus.PENDING);

        payment = new Payment();
        payment.setId(500L);
        payment.setOrder(order);
        payment.setBuyer(buyer);
        payment.setAmount(BigDecimal.valueOf(1500));
        payment.setCurrency("INR");
        payment.setPaymentStatus(Payment.PaymentStatus.INITIATED);
        payment.setRazorpayOrderId("order_mock_12345");

        // Authenticate default test buyer context
        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_BUYER"));
        com.smartkrishi.security.UserPrincipal principal = new com.smartkrishi.security.UserPrincipal(
                10L,
                "buyer@smartkrishi.com",
                "buyer@smartkrishi.com",
                "pwd",
                authorities
        );

        org.springframework.security.core.Authentication auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, authorities);
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    public void testCreatePayment_NewOrder() {
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(100L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentDTO dto = PaymentDTO.builder().orderId(100L).build();
        PaymentDTO result = paymentService.createPayment(dto);

        assertNotNull(result);
        assertEquals(0, BigDecimal.valueOf(1500).compareTo(result.getAmount()));
        assertEquals("INITIATED", result.getPaymentStatus());
        assertEquals("key_id", result.getRazorpayKeyId());
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    public void testCreatePayment_RetryOrder_Success() {
        payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
        
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(100L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentDTO dto = PaymentDTO.builder().orderId(100L).build();
        PaymentDTO result = paymentService.createPayment(dto);

        assertNotNull(result);
        assertEquals("INITIATED", result.getPaymentStatus());
        assertEquals("order_mock_12345", result.getRazorpayOrderId());
        verify(paymentRepository).save(payment);
    }

    @Test
    public void testCreatePayment_AlreadySuccess_ThrowsException() {
        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(100L)).thenReturn(Optional.of(payment));

        PaymentDTO dto = PaymentDTO.builder().orderId(100L).build();
        assertThrows(BadRequestException.class, () -> paymentService.createPayment(dto));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    public void testVerifyPayment_Success() {
        when(paymentRepository.findById(500L)).thenReturn(Optional.of(payment));
        when(paymentRepository.findByRazorpayPaymentId("pay_12345")).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentDTO result = paymentService.verifyPayment(500L, "pay_12345", "mock_sig_123");

        assertNotNull(result);
        assertEquals("SUCCESS", result.getPaymentStatus());
        assertEquals("pay_12345", result.getRazorpayPaymentId());
        assertEquals(Order.OrderStatus.ACCEPTED, order.getOrderStatus());
        verify(paymentRepository).save(payment);
        verify(orderRepository).save(order);
    }

    @Test
    public void testVerifyPayment_ReplayAttack_ThrowsException() {
        Payment duplicatePayment = new Payment();
        duplicatePayment.setId(600L);
        duplicatePayment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
        duplicatePayment.setRazorpayPaymentId("pay_reused");

        when(paymentRepository.findById(500L)).thenReturn(Optional.of(payment));
        when(paymentRepository.findByRazorpayPaymentId("pay_reused")).thenReturn(Optional.of(duplicatePayment));

        assertThrows(BadRequestException.class, () -> paymentService.verifyPayment(500L, "pay_reused", "mock_sig"));
        verify(paymentRepository, never()).save(payment);
    }

    @Test
    public void testProcessRefund_Success() {
        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId("pay_sim_12345");

        when(paymentRepository.findById(500L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentDTO result = paymentService.processRefund(500L, "Customer returned product");

        assertNotNull(result);
        assertEquals("REFUNDED", result.getPaymentStatus());
        assertEquals(Order.OrderStatus.CANCELLED, order.getOrderStatus());
        verify(paymentRepository).save(payment);
        verify(orderRepository).save(order);
    }

    @Test
    public void testHandleWebhook_PaymentCaptured() {
        String payload = "{\n" +
                "  \"event\": \"payment.captured\",\n" +
                "  \"payload\": {\n" +
                "    \"payment\": {\n" +
                "      \"entity\": {\n" +
                "        \"id\": \"pay_web_12345\",\n" +
                "        \"order_id\": \"order_mock_12345\",\n" +
                "        \"method\": \"upi\"\n" +
                "      }\n" +
                "    }\n" +
                "  }\n" +
                "}";

        when(paymentRepository.findByRazorpayOrderId("order_mock_12345")).thenReturn(Optional.of(payment));
        when(paymentRepository.findByRazorpayPaymentId("pay_web_12345")).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.handleWebhook(payload, "sig_sim_123");

        assertEquals(Payment.PaymentStatus.SUCCESS, payment.getPaymentStatus());
        assertEquals("pay_web_12345", payment.getRazorpayPaymentId());
        assertEquals("upi", payment.getPaymentMethod());
        assertEquals(Order.OrderStatus.ACCEPTED, order.getOrderStatus());
        verify(paymentRepository).save(payment);
        verify(orderRepository).save(order);
    }

    @Test
    public void testHandleWebhook_PaymentFailed() {
        String payload = "{\n" +
                "  \"event\": \"payment.failed\",\n" +
                "  \"payload\": {\n" +
                "    \"payment\": {\n" +
                "      \"entity\": {\n" +
                "        \"id\": \"pay_web_failed\",\n" +
                "        \"order_id\": \"order_mock_12345\",\n" +
                "        \"error_description\": \"Bank gateway timed out\"\n" +
                "      }\n" +
                "    }\n" +
                "  }\n" +
                "}";

        when(paymentRepository.findByRazorpayOrderId("order_mock_12345")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.handleWebhook(payload, "sig_sim_123");

        assertEquals(Payment.PaymentStatus.FAILED, payment.getPaymentStatus());
        assertEquals("Bank gateway timed out", payment.getFailureReason());
        verify(paymentRepository).save(payment);
    }
}
