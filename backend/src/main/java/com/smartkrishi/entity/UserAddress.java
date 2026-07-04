package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_addresses", indexes = {
        @Index(name = "idx_user_default", columnList = "user_id, is_default")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "user")
@EqualsAndHashCode(exclude = "user")
public class UserAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "address_type", nullable = false)
    private AddressType addressType;

    @Column(name = "full_name", nullable = false, length = 255)
    @NotBlank(message = "Full name is required")
    private String fullName;

    @Column(name = "mobile_number", nullable = false, length = 20)
    @NotBlank(message = "Mobile number is required")
    private String mobileNumber;

    @Column(name = "alternate_mobile_number", length = 20)
    private String alternateMobileNumber;

    @Column(name = "house_number", nullable = false, length = 255)
    @NotBlank(message = "House/Flat number is required")
    private String houseNumber;

    @Column(name = "street", nullable = false, length = 255)
    @NotBlank(message = "Street address is required")
    private String street;

    @Column(name = "landmark", length = 255)
    private String landmark;

    @Column(name = "village", length = 100)
    private String village;

    @Column(name = "city", nullable = false, length = 100)
    @NotBlank(message = "Village/City is required")
    private String city;

    private Double latitude;
    private Double longitude;

    @Column(name = "district", nullable = false, length = 100)
    @NotBlank(message = "District is required")
    private String district;

    @Column(name = "state", nullable = false, length = 100)
    @NotBlank(message = "State is required")
    private String state;

    @Column(name = "pincode", nullable = false, length = 20)
    @NotBlank(message = "Pincode is required")
    private String pincode;

    @Column(name = "country", nullable = false, length = 100)
    private String country = "India";

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum AddressType {
        HOME, FARM, OFFICE, WAREHOUSE, OTHER
    }
}
