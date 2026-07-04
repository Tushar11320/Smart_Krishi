package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.smartkrishi.dto.payment.PaymentDTO;
import com.smartkrishi.service.payment.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@AllArgsConstructor
@Tag(name = "Payments", description = "APIs for payment management")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new payment")
    public ResponseEntity<ApiResponse<PaymentDTO>> createPayment(@Valid @RequestBody PaymentDTO paymentDTO) {
        PaymentDTO created = paymentService.createPayment(paymentDTO);
        return new ResponseEntity<>(new ApiResponse<>(true, "Payment created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<ApiResponse<PaymentDTO>> getPaymentById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentDTO payment = paymentService.getPaymentByIdSecure(id, userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment retrieved successfully", payment));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Get payment by order ID")
    public ResponseEntity<ApiResponse<PaymentDTO>> getPaymentByOrderId(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentDTO payment = paymentService.getPaymentByOrderIdSecure(orderId, userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment retrieved successfully", payment));
    }

    @GetMapping("/transaction/{transactionId}")
    @PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Get payment by transaction ID")
    public ResponseEntity<ApiResponse<PaymentDTO>> getPaymentByTransactionId(
            @PathVariable String transactionId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentDTO payment = paymentService.getPaymentByTransactionIdSecure(transactionId, userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment retrieved successfully", payment));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or ((hasRole('USER') or hasRole('BUYER')) and #userId == principal.id)")
    @Operation(summary = "Get all payments for a user")
    public ResponseEntity<ApiResponse<Page<PaymentDTO>>> getUserPayments(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            Pageable pageable) {
        Page<PaymentDTO> payments = paymentService.getUserPayments(userId, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payments retrieved successfully", payments));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get payments by status")
    public ResponseEntity<ApiResponse<Page<PaymentDTO>>> getPaymentsByStatus(
            @PathVariable String status,
            Pageable pageable) {
        Page<PaymentDTO> payments = paymentService.getPaymentsByStatus(status, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payments retrieved successfully", payments));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Update payment status")
    public ResponseEntity<ApiResponse<PaymentDTO>> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentDTO payment = paymentService.updatePaymentStatusSecure(id, status, userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment status updated successfully", payment));
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
    @Operation(summary = "Verify payment")
    public ResponseEntity<ApiResponse<PaymentDTO>> verifyPayment(
            @PathVariable Long id,
            @RequestParam String transactionId,
            @RequestParam(required = false) String signature) {
        PaymentDTO payment = paymentService.verifyPayment(id, transactionId, signature);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment verified successfully", payment));
    }

    @PostMapping("/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Process refund")
    public ResponseEntity<ApiResponse<PaymentDTO>> processRefund(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        PaymentDTO payment = paymentService.processRefund(id, reason);
        return ResponseEntity.ok(new ApiResponse<>(true, "Refund processed successfully", payment));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Handle Razorpay webhooks")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/config")
    @Operation(summary = "Get payment configurations")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> getPaymentConfig() {
        java.util.Map<String, Boolean> config = new java.util.HashMap<>();
        config.put("codEnabled", paymentService.isCodEnabled());
        config.put("bankTransferEnabled", paymentService.isBankTransferEnabled());
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment config retrieved", config));
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update payment configurations")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> updatePaymentConfig(
            @RequestParam boolean codEnabled,
            @RequestParam boolean bankTransferEnabled) {
        paymentService.setCodEnabled(codEnabled);
        paymentService.setBankTransferEnabled(bankTransferEnabled);
        java.util.Map<String, Boolean> config = new java.util.HashMap<>();
        config.put("codEnabled", paymentService.isCodEnabled());
        config.put("bankTransferEnabled", paymentService.isBankTransferEnabled());
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment config updated", config));
    }
}
