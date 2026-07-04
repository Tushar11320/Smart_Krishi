package com.smartkrishi.dto.weather;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherResponseDTO {
    private String city;
    private Double temperature;
    private Double feelsLike;
    private Integer humidity;
    private Double windSpeed;
    private Integer visibility;
    private String weatherCondition;
    private String weatherDescription;
    private Double rainProbability;
    private Long sunrise;
    private Long sunset;
    private Integer airQualityIndex;
    private Double latitude;
    private Double longitude;
    private List<String> alerts;
    private List<String> recommendations;
}
