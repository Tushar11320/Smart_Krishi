package com.smartkrishi.service.weather;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartkrishi.dto.weather.WeatherForecastItemDTO;
import com.smartkrishi.dto.weather.WeatherForecastResponseDTO;
import com.smartkrishi.dto.weather.WeatherResponseDTO;
import com.smartkrishi.entity.WeatherCache;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.LocationNotFoundException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.WeatherCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherServiceImpl implements WeatherService {

    private final WeatherCacheRepository cacheRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openweather.api-key}")
    private String apiKey;

    @Value("${openweather.base-url:https://api.openweathermap.org/data/2.5}")
    private String baseUrl;

    private static final int MAX_RETRIES = 3;
    private static final int BACKOFF_MULTIPLIER = 2;
    private static final int INITIAL_BACKOFF_MS = 1000;
    private static final int CACHE_MINUTES = 30;

    @Override
    public WeatherResponseDTO getCurrentWeather(String city) {
        log.info("Requesting current weather for city: {}", city);
        if (city == null || city.trim().isEmpty()) {
            throw new BadRequestException("City name must not be empty");
        }

        String cleanedCity = correctCommonMisspellings(city.trim());
        String cacheKey = cleanedCity.toLowerCase();
        Optional<WeatherCache> cachedOpt = cacheRepository.findByCityIgnoreCase(cacheKey);

        if (cachedOpt.isPresent()) {
            WeatherCache cache = cachedOpt.get();
            if (cache.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(CACHE_MINUTES))) {
                log.info("Cache hit for city weather: {}", cleanedCity);
                try {
                    return parseCurrentWeatherResponse(cache.getApiResponse(), cache.getCity());
                } catch (Exception e) {
                    log.error("Failed to parse cached weather response, fetching fresh data", e);
                }
            } else {
                log.info("Cache expired for city weather: {}", cleanedCity);
            }
        }

        // Cache miss - resolve coordinates first using Geocoding API
        double[] coords = getCoordinatesForCity(cleanedCity);
        Double lat = coords[0];
        Double lon = coords[1];

        // Fetch from OpenWeather API using coordinates
        String url = String.format("%s/weather?lat=%s&lon=%s&appid=%s&units=metric", baseUrl, lat, lon, apiKey);
        String apiResponse = executeWithRetry(url);

        try {
            // Validate and parse to verify correctness
            WeatherResponseDTO dto = parseCurrentWeatherResponse(apiResponse, cleanedCity);
            
            // Get coordinates to fetch air quality
            dto.setLatitude(lat);
            dto.setLongitude(lon);
            if (lat != null && lon != null) {
                try {
                    Integer aqi = fetchAirQualityIndex(lat, lon);
                    dto.setAirQualityIndex(aqi);
                } catch (Exception e) {
                    log.warn("Failed to fetch air quality index for coordinates: {}, {}", lat, lon, e);
                }
            }

            // Fetch forecast to get rain probability (pop)
            try {
                Double rainProb = fetchRainProbability(lat, lon);
                dto.setRainProbability(rainProb);
            } catch (Exception e) {
                log.warn("Failed to fetch rain probability for coordinates: {}, {}", lat, lon, e);
            }

            // Generate alerts and recommendations based on enriched data
            generateAlertsAndRecommendations(dto);

            // Re-serialize the enriched dto to cache it
            String enrichedApiResponse = objectMapper.writeValueAsString(dto);

            // Save to database cache
            WeatherCache weatherCache = cachedOpt.orElse(new WeatherCache());
            weatherCache.setCity(cacheKey);
            weatherCache.setTemperature(dto.getTemperature());
            weatherCache.setHumidity(dto.getHumidity());
            weatherCache.setWeatherCondition(dto.getWeatherCondition());
            weatherCache.setApiResponse(enrichedApiResponse);
            weatherCache.setCreatedAt(LocalDateTime.now());
            cacheRepository.save(weatherCache);

            return dto;
        } catch (Exception e) {
            log.error("Error processing weather API response for city: {}", city, e);
            throw new BadRequestException("Failed to process weather data for: " + city);
        }
    }

    @Override
    public WeatherForecastResponseDTO getForecast(String city) {
        log.info("Requesting 5-day forecast for city: {}", city);
        if (city == null || city.trim().isEmpty()) {
            throw new BadRequestException("City name must not be empty");
        }

        String cleanedCity = correctCommonMisspellings(city.trim());
        String cacheKey = "forecast:" + cleanedCity.toLowerCase();
        Optional<WeatherCache> cachedOpt = cacheRepository.findByCityIgnoreCase(cacheKey);

        if (cachedOpt.isPresent()) {
            WeatherCache cache = cachedOpt.get();
            if (cache.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(CACHE_MINUTES))) {
                log.info("Cache hit for city forecast: {}", cleanedCity);
                try {
                    return objectMapper.readValue(cache.getApiResponse(), WeatherForecastResponseDTO.class);
                } catch (Exception e) {
                    log.error("Failed to parse cached forecast response, fetching fresh data", e);
                }
            }
        }

        // Cache miss - resolve coordinates first using Geocoding API
        double[] coords = getCoordinatesForCity(cleanedCity);
        double lat = coords[0];
        double lon = coords[1];

        // Fetch forecast using coordinates
        String url = String.format("%s/forecast?lat=%s&lon=%s&appid=%s&units=metric", baseUrl, lat, lon, apiKey);
        String apiResponse = executeWithRetry(url);

        try {
            WeatherForecastResponseDTO dto = parseForecastResponse(apiResponse, cleanedCity);

            // Save to database cache
            WeatherCache weatherCache = cachedOpt.orElse(new WeatherCache());
            weatherCache.setCity(cacheKey);
            if (!dto.getForecasts().isEmpty()) {
                weatherCache.setTemperature(dto.getForecasts().get(0).getTemperature());
                weatherCache.setHumidity(dto.getForecasts().get(0).getHumidity());
                weatherCache.setWeatherCondition(dto.getForecasts().get(0).getWeatherCondition());
            }
            weatherCache.setApiResponse(objectMapper.writeValueAsString(dto));
            weatherCache.setCreatedAt(LocalDateTime.now());
            cacheRepository.save(weatherCache);

            return dto;
        } catch (Exception e) {
            log.error("Error processing forecast API response for city: {}", city, e);
            throw new BadRequestException("Failed to process forecast data for: " + city);
        }
    }

    @Override
    public WeatherResponseDTO getWeatherByCoordinates(double lat, double lon) {
        log.info("Requesting current weather for coordinates: lat={}, lon={}", lat, lon);

        // Round coordinates to 2 decimal places (approx 1.1km accuracy) to support caching
        double roundedLat = Math.round(lat * 100.0) / 100.0;
        double roundedLon = Math.round(lon * 100.0) / 100.0;
        String cacheKey = String.format("coords:%s,%s", roundedLat, roundedLon);

        Optional<WeatherCache> cachedOpt = cacheRepository.findByCityIgnoreCase(cacheKey);

        if (cachedOpt.isPresent()) {
            WeatherCache cache = cachedOpt.get();
            if (cache.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(CACHE_MINUTES))) {
                log.info("Cache hit for coordinate weather: {}", cacheKey);
                try {
                    return objectMapper.readValue(cache.getApiResponse(), WeatherResponseDTO.class);
                } catch (Exception e) {
                    log.error("Failed to parse cached coordinate response, fetching fresh data", e);
                }
            }
        }

        // Cache miss - Fetch from OpenWeather API using coordinates
        String url = String.format("%s/weather?lat=%s&lon=%s&appid=%s&units=metric", baseUrl, lat, lon, apiKey);
        String apiResponse = executeWithRetry(url);

        try {
            WeatherResponseDTO dto = parseCurrentWeatherResponse(apiResponse, null);
            dto.setLatitude(lat);
            dto.setLongitude(lon);

            // Fetch air quality
            try {
                Integer aqi = fetchAirQualityIndex(lat, lon);
                dto.setAirQualityIndex(aqi);
            } catch (Exception e) {
                log.warn("Failed to fetch air quality for coordinate weather", e);
            }

            // Fetch forecast for rain probability
            try {
                Double rainProb = fetchRainProbability(lat, lon);
                dto.setRainProbability(rainProb);
            } catch (Exception e) {
                log.warn("Failed to fetch rain probability for coordinate weather", e);
            }

            generateAlertsAndRecommendations(dto);

            // Save to database cache
            WeatherCache weatherCache = cachedOpt.orElse(new WeatherCache());
            weatherCache.setCity(cacheKey);
            weatherCache.setTemperature(dto.getTemperature());
            weatherCache.setHumidity(dto.getHumidity());
            weatherCache.setWeatherCondition(dto.getWeatherCondition());
            weatherCache.setApiResponse(objectMapper.writeValueAsString(dto));
            weatherCache.setCreatedAt(LocalDateTime.now());
            cacheRepository.save(weatherCache);

            return dto;
        } catch (Exception e) {
            log.error("Error processing coordinate weather API response", e);
            throw new BadRequestException("Failed to process weather data for coordinates: " + lat + ", " + lon);
        }
    }

    @Override
    public Map<String, Object> getAirPollution(double lat, double lon) {
        log.info("Requesting air pollution for coordinates: lat={}, lon={}", lat, lon);

        double roundedLat = Math.round(lat * 100.0) / 100.0;
        double roundedLon = Math.round(lon * 100.0) / 100.0;
        String cacheKey = String.format("aqi:%s,%s", roundedLat, roundedLon);

        Optional<WeatherCache> cachedOpt = cacheRepository.findByCityIgnoreCase(cacheKey);

        if (cachedOpt.isPresent()) {
            WeatherCache cache = cachedOpt.get();
            if (cache.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(CACHE_MINUTES))) {
                log.info("Cache hit for air pollution: {}", cacheKey);
                try {
                    return objectMapper.readValue(cache.getApiResponse(), Map.class);
                } catch (Exception e) {
                    log.error("Failed to parse cached air pollution response, fetching fresh data", e);
                }
            }
        }

        // Cache miss
        String url = String.format("%s/air_pollution?lat=%s&lon=%s&appid=%s", baseUrl, lat, lon, apiKey);
        String apiResponse = executeWithRetry(url);

        try {
            JsonNode root = objectMapper.readTree(apiResponse);
            JsonNode firstListItem = root.path("list").get(0);
            int aqi = firstListItem.path("main").path("aqi").asInt(1);
            JsonNode componentsNode = firstListItem.path("components");

            Map<String, Object> result = new HashMap<>();
            result.put("airQualityIndex", aqi);
            result.put("aqiDescription", getAqiDescription(aqi));
            
            Map<String, Double> pollutants = new HashMap<>();
            componentsNode.fields().forEachRemaining(entry -> {
                pollutants.put(entry.getKey(), entry.getValue().asDouble());
            });
            result.put("components", pollutants);

            // Save to database cache
            WeatherCache weatherCache = cachedOpt.orElse(new WeatherCache());
            weatherCache.setCity(cacheKey);
            weatherCache.setApiResponse(objectMapper.writeValueAsString(result));
            weatherCache.setCreatedAt(LocalDateTime.now());
            cacheRepository.save(weatherCache);

            return result;
        } catch (Exception e) {
            log.error("Error processing air pollution API response", e);
            throw new BadRequestException("Failed to process air quality data");
        }
    }

    // Helper to fetch Air Quality index as integer directly
    private Integer fetchAirQualityIndex(double lat, double lon) {
        String url = String.format("%s/air_pollution?lat=%s&lon=%s&appid=%s", baseUrl, lat, lon, apiKey);
        try {
            String apiResponse = executeWithRetry(url);
            JsonNode root = objectMapper.readTree(apiResponse);
            return root.path("list").get(0).path("main").path("aqi").asInt(1);
        } catch (Exception e) {
            log.warn("Failed to fetch AQI", e);
            return 1;
        }
    }

    // Helper to fetch rain probability from 5-day forecast
    private Double fetchRainProbability(Double lat, Double lon) {
        if (lat == null || lon == null) return 0.0;
        String url = String.format("%s/forecast?lat=%s&lon=%s&appid=%s&units=metric", baseUrl, lat, lon, apiKey);
        try {
            String apiResponse = executeWithRetry(url);
            JsonNode root = objectMapper.readTree(apiResponse);
            JsonNode firstForecast = root.path("list").get(0);
            // OpenWeather pop is between 0 and 1, convert to percentage
            return firstForecast.path("pop").asDouble(0.0) * 100;
        } catch (Exception e) {
            log.warn("Failed to fetch rain probability", e);
            return 0.0;
        }
    }

    // Parse current weather JSON into WeatherResponseDTO
    private WeatherResponseDTO parseCurrentWeatherResponse(String jsonContent, String fallbackCity) throws Exception {
        JsonNode root = objectMapper.readTree(jsonContent);
        
        // If the json is a pre-parsed WeatherResponseDTO (from database cache), deserialize it directly
        if (root.has("temperature") && root.has("weatherCondition")) {
            return objectMapper.treeToValue(root, WeatherResponseDTO.class);
        }

        JsonNode main = root.path("main");
        JsonNode wind = root.path("wind");
        JsonNode sys = root.path("sys");
        JsonNode coord = root.path("coord");
        JsonNode weatherArray = root.path("weather");
        JsonNode weatherNode = weatherArray.get(0);

        String cityName = root.path("name").asText(fallbackCity);
        Double temp = main.path("temp").asDouble();
        Double feelsLike = main.path("feels_like").asDouble();
        Integer humidity = main.path("humidity").asInt();
        Double windSpeed = wind.path("speed").asDouble() * 3.6; // Convert m/s to km/h
        Integer visibility = root.path("visibility").asInt(10000);
        String condition = weatherNode.path("main").asText("Unknown");
        String description = weatherNode.path("description").asText("No description");
        Long sunrise = sys.path("sunrise").asLong();
        Long sunset = sys.path("sunset").asLong();
        Double lat = coord.path("lat").asDouble();
        Double lon = coord.path("lon").asDouble();

        return WeatherResponseDTO.builder()
                .city(cityName)
                .temperature(temp)
                .feelsLike(feelsLike)
                .humidity(humidity)
                .windSpeed(Math.round(windSpeed * 10.0) / 10.0)
                .visibility(visibility)
                .weatherCondition(condition)
                .weatherDescription(description)
                .sunrise(sunrise)
                .sunset(sunset)
                .latitude(lat)
                .longitude(lon)
                .airQualityIndex(1) // Default, will be filled
                .rainProbability(0.0) // Default, will be filled
                .build();
    }

    // Parse forecast JSON into WeatherForecastResponseDTO
    private WeatherForecastResponseDTO parseForecastResponse(String jsonContent, String city) throws Exception {
        JsonNode root = objectMapper.readTree(jsonContent);
        JsonNode listNode = root.path("list");
        String cityName = root.path("city").path("name").asText(city);

        List<WeatherForecastItemDTO> forecasts = new ArrayList<>();
        Map<String, List<JsonNode>> dailyGroups = new LinkedHashMap<>();

        // Group 3-hour intervals by date (yyyy-MM-dd)
        for (JsonNode item : listNode) {
            String dtTxt = item.path("dt_txt").asText();
            if (dtTxt.length() >= 10) {
                String date = dtTxt.substring(0, 10);
                dailyGroups.computeIfAbsent(date, k -> new ArrayList<>()).add(item);
            }
        }

        // Generate one forecast card per day
        DateTimeFormatter parser = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE");

        int limit = 0;
        for (Map.Entry<String, List<JsonNode>> entry : dailyGroups.entrySet()) {
            if (limit >= 5) break; // We only need 5 days

            List<JsonNode> intervals = entry.getValue();
            // Select the noon interval (around 12:00:00) if available, otherwise take the middle one
            JsonNode selectedNode = intervals.get(intervals.size() / 2);
            for (JsonNode node : intervals) {
                if (node.path("dt_txt").asText().contains("12:00:00")) {
                    selectedNode = node;
                    break;
                }
            }

            JsonNode main = selectedNode.path("main");
            JsonNode wind = selectedNode.path("wind");
            JsonNode weatherNode = selectedNode.path("weather").get(0);
            Double pop = selectedNode.path("pop").asDouble(0.0);

            LocalDateTime localDate = LocalDate.parse(entry.getKey(), parser).atStartOfDay();
            String dayOfWeek = localDate.format(formatter);

            forecasts.add(WeatherForecastItemDTO.builder()
                    .dateTime(entry.getKey() + " 12:00:00")
                    .dayOfWeek(dayOfWeek)
                    .temperature(main.path("temp").asDouble())
                    .feelsLike(main.path("feels_like").asDouble())
                    .humidity(main.path("humidity").asInt())
                    .windSpeed(Math.round((wind.path("speed").asDouble() * 3.6) * 10.0) / 10.0)
                    .weatherCondition(weatherNode.path("main").asText("Unknown"))
                    .weatherDescription(weatherNode.path("description").asText("No description"))
                    .rainProbability(Math.round((pop * 100) * 10.0) / 10.0)
                    .build());

            limit++;
        }

        return WeatherForecastResponseDTO.builder()
                .city(cityName)
                .forecasts(forecasts)
                .build();
    }

    // Execute REST call with retry mechanism and exponential backoff
    private String executeWithRetry(String url) {
        int attempt = 0;
        long backoff = INITIAL_BACKOFF_MS;

        while (true) {
            try {
                attempt++;
                log.info("Calling OpenWeather API (Attempt {}/{}): {}", attempt, MAX_RETRIES, url.replaceAll("appid=[^&]+", "appid=HIDDEN"));
                return restTemplate.getForObject(url, String.class);
            } catch (HttpClientErrorException e) {
                log.error("HTTP Client Error calling OpenWeather API: Code={}", e.getStatusCode());
                if (e.getStatusCode().value() == 404) {
                    throw new ResourceNotFoundException("Location details not found on OpenWeather API");
                }
                if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
                    throw new BadRequestException("Invalid OpenWeather API Key configuration");
                }
                throw new BadRequestException("API error: " + e.getResponseBodyAsString());
            } catch (HttpServerErrorException | ResourceAccessException e) {
                log.error("Network or server error calling OpenWeather API: message={}, attempt={}", e.getMessage(), attempt);
                if (attempt >= MAX_RETRIES) {
                    throw new ResourceAccessException("Failed to connect to weather service after " + MAX_RETRIES + " retries. Details: " + e.getMessage());
                }
                try {
                    Thread.sleep(backoff);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new ResourceAccessException("API call retry interrupted");
                }
                backoff *= BACKOFF_MULTIPLIER;
            } catch (Exception e) {
                log.error("Unexpected error calling OpenWeather API", e);
                throw new BadRequestException("Unexpected weather service error: " + e.getMessage());
            }
        }
    }

    // Generate farming recommendations based on weather parameters
    private void generateAlertsAndRecommendations(WeatherResponseDTO dto) {
        List<String> alerts = new ArrayList<>();
        List<String> recs = new ArrayList<>();

        Double temp = dto.getTemperature();
        Double wind = dto.getWindSpeed();
        Integer hum = dto.getHumidity();
        String cond = dto.getWeatherCondition().toLowerCase();
        Double rain = dto.getRainProbability();

        // 1. Rain Alerts
        if (cond.contains("rain") || cond.contains("drizzle") || cond.contains("thunderstorm") || rain > 30.0) {
            alerts.add("☔ Rain Expected Alert: Pre-precipitation conditions active.");
            recs.add("Delay fertilizer spraying to prevent wash-off.");
            recs.add("Avoid sowing seeds immediately before heavy rainfall.");
            recs.add("Secure harvested crops in high-ground covered storage.");
        } else {
            recs.add("Ideal dry conditions for applying fertilizers and spraying insecticides.");
        }

        // 2. Wind Alerts
        if (wind > 20.0) {
            alerts.add("💨 Strong Wind Alert: Wind speeds exceed 20 km/h.");
            recs.add("Avoid pesticide spraying to prevent chemical drift and ensure safety.");
            recs.add("Provide stake supports for tall, vulnerable crops like maize, sugarcane, and bananas.");
        } else {
            recs.add("Gentle wind speed. Suitable for spraying activities.");
        }

        // 3. Heat/Temperature Alerts
        if (temp > 40.0) {
            alerts.add("🔥 Extreme Heat Warning: Temperature exceeds 40°C.");
            recs.add("Provide additional irrigation, preferably in early morning or late evening.");
            recs.add("Use mulch to conserve soil moisture.");
            recs.add("Provide shade coverings for sensitive vegetable nurseries.");
        } else if (temp < 12.0) {
            alerts.add("❄️ Cold Climate Alert: Temperatures below 12°C.");
            recs.add("Protect frost-sensitive crops.");
            recs.add("Apply light irrigation at night to maintain soil temperature.");
        } else {
            recs.add("Temperature is moderate and supportive of general crop growth.");
        }

        // 4. Humidity alerts
        if (hum > 85) {
            alerts.add("💧 High Humidity Alert: Moisture content above 85%.");
            recs.add("High humidity increases risk of fungal diseases. Inspect crops regularly.");
            recs.add("Ensure proper crop spacing and weed removal to improve air circulation.");
        } else if (hum < 30) {
            recs.add("Low humidity increases soil evaporation. Check soil moisture content.");
        }

        // 5. Air Quality alerts
        if (dto.getAirQualityIndex() != null && dto.getAirQualityIndex() >= 4) {
            alerts.add("😷 Poor Air Quality: AQI index indicates unhealthy atmosphere.");
            recs.add("Limit strenuous outdoor agricultural labor.");
            recs.add("Wear protective dust/pesticide masks if working outdoors is required.");
        }

        dto.setAlerts(alerts);
        dto.setRecommendations(recs);
    }

    private String getAqiDescription(int aqi) {
        switch (aqi) {
            case 1: return "Good";
            case 2: return "Fair";
            case 3: return "Moderate";
            case 4: return "Poor";
            case 5: return "Very Poor";
            default: return "Unknown";
        }
    }

    private String correctCommonMisspellings(String city) {
        if (city == null) return null;
        String lowercase = city.trim().toLowerCase();
        Map<String, String> corrections = new HashMap<>();
        corrections.put("indor", "Indore");
        corrections.put("bopal", "Bhopal");
        corrections.put("mubai", "Mumbai");
        corrections.put("dehli", "Delhi");
        corrections.put("deli", "Delhi");
        corrections.put("banglore", "Bengaluru");
        corrections.put("kolkataa", "Kolkata");
        corrections.put("chenai", "Chennai");
        
        return corrections.getOrDefault(lowercase, city);
    }

    private double[] getCoordinatesForCity(String city) {
        if (city == null || city.trim().isEmpty()) {
            throw new BadRequestException("City name must not be empty");
        }
        
        String cleanCity = city.trim();
        String geoUrl = baseUrl.replace("/data/2.5", "") + String.format("/geo/1.0/direct?q=%s&limit=1&appid=%s", cleanCity, apiKey);
        
        try {
            String response = executeWithRetry(geoUrl);
            JsonNode root = objectMapper.readTree(response);
            if (root.isArray() && root.size() > 0) {
                JsonNode first = root.get(0);
                double lat = first.path("lat").asDouble();
                double lon = first.path("lon").asDouble();
                return new double[]{lat, lon};
            } else {
                throw new LocationNotFoundException("Location not found. Please enter a valid city or location name.");
            }
        } catch (LocationNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error calling geocoding API for city: {}", cleanCity, e);
            throw new BadRequestException("Failed to resolve location details");
        }
    }
}
