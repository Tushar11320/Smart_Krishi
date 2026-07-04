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
public class WeatherForecastResponseDTO {
    private String city;
    private List<WeatherForecastItemDTO> forecasts;
}
