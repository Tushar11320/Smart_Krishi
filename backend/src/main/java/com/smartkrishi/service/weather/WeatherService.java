package com.smartkrishi.service.weather;

import com.smartkrishi.dto.weather.WeatherForecastResponseDTO;
import com.smartkrishi.dto.weather.WeatherResponseDTO;
import java.util.Map;

public interface WeatherService {
    WeatherResponseDTO getCurrentWeather(String city);
    WeatherForecastResponseDTO getForecast(String city);
    WeatherResponseDTO getWeatherByCoordinates(double lat, double lon);
    Map<String, Object> getAirPollution(double lat, double lon);
}
