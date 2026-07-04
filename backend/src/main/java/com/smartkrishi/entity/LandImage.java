package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "land_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "landListing")
@EqualsAndHashCode(exclude = "landListing")
public class LandImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "land_listing_id", nullable = false)
    private LandListing landListing;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(length = 255)
    private String publicId;

    @Column(nullable = false)
    private Boolean isPrimary = false;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
