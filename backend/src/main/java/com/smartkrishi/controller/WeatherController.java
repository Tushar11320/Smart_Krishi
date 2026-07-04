package com.smartkrishi.controller;

import com.smartkrishi.dto.weather.WeatherForecastResponseDTO;
import com.smartkrishi.dto.weather.WeatherResponseDTO;
import com.smartkrishi.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/current")
    public ResponseEntity<WeatherResponseDTO> getCurrentWeather(@RequestParam(value = "city", defaultValue = "Bhopal") String city) {
        log.info("REST request to get current weather for city: {}", city);
        WeatherResponseDTO weather = weatherService.getCurrentWeather(city);
        return ResponseEntity.ok(weather);
    }

    @GetMapping("/forecast")
    public ResponseEntity<WeatherForecastResponseDTO> getForecast(@RequestParam(value = "city", defaultValue = "Bhopal") String city) {
        log.info("REST request to get weather forecast for city: {}", city);
        WeatherForecastResponseDTO forecast = weatherService.getForecast(city);
        return ResponseEntity.ok(forecast);
    }

    @GetMapping("/location")
    public ResponseEntity<WeatherResponseDTO> getWeatherByCoordinates(@RequestParam("lat") double lat, @RequestParam("lon") double lon) {
        log.info("REST request to get weather by coordinates: lat={}, lon={}", lat, lon);
        WeatherResponseDTO weather = weatherService.getWeatherByCoordinates(lat, lon);
        return ResponseEntity.ok(weather);
    }

    @GetMapping("/air-quality")
    public ResponseEntity<Map<String, Object>> getAirPollution(@RequestParam("lat") double lat, @RequestParam("lon") double lon) {
        log.info("REST request to get air pollution by coordinates: lat={}, lon={}", lat, lon);
        Map<String, Object> airQuality = weatherService.getAirPollution(lat, lon);
        return ResponseEntity.ok(airQuality);
    }
}
