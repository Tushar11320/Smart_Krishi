package com.smartkrishi.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "product_specifications", indexes = {
        @Index(name = "idx_spec_key", columnList = "spec_key"),
        @Index(name = "idx_product_specs", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "product")
@EqualsAndHashCode(exclude = "product")
public class ProductSpecification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Specification key is required")
    private String specKey;

    @Column(nullable = false, length = 1000)
    @NotBlank(message = "Specification value is required")
    private String specValue;

    @Column(nullable = false)
    private Integer displayOrder = 0;
}
