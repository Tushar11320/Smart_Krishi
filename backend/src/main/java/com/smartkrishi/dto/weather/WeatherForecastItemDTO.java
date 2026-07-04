package com.smartkrishi.dto.weather;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherForecastItemDTO {
    private String dateTime; // e.g. "2026-06-20 12:00:00"
    private String dayOfWeek; // e.g. "Sat"
    private Double temperature;
    private Double feelsLike;
    private Integer humidity;
    private Double windSpeed;
    private String weatherCondition;
    private String weatherDescription;
    private Double rainProbability;
}
