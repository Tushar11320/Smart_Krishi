package com.smartkrishi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "weather_cache")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String city;

    private Double temperature;

    private Integer humidity;

    @Column(name = "weather_condition", length = 100)
    private String weatherCondition;

    @Column(name = "api_response", columnDefinition = "LONGTEXT")
    private String apiResponse;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
