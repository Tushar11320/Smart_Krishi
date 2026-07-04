package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class ProductInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(nullable = false)
    private Integer quantityAvailable = 0;

    @Column(nullable = false)
    private Integer quantityReserved = 0;

    @Column(nullable = false)
    private Integer quantitySold = 0;

    @Column(nullable = false)
    private Integer reorderLevel = 10;

    @Column(nullable = false)
    private Integer reorderQuantity = 50;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastStockUpdate;

    public Integer getAvailableQuantity() {
        return quantityAvailable - quantityReserved;
    }
}
