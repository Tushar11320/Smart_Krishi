package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "seller_bank_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "seller")
@EqualsAndHashCode(exclude = "seller")
public class SellerBankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Account holder name is required")
    private String accountHolderName;

    @Column(nullable = false, unique = true, length = 50)
    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @Column(nullable = false, length = 20)
    @NotBlank(message = "IFSC code is required")
    private String ifscCode;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Bank name is required")
    private String bankName;

    @Column(nullable = false)
    private Boolean isVerified = false;

    @Column(nullable = false)
    private Boolean isPrimary = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
