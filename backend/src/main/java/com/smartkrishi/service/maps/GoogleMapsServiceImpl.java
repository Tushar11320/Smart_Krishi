package com.smartkrishi.service.maps;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleMapsServiceImpl implements GoogleMapsService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${google.maps.api-key:}")
    private String apiKey;

    // In-memory caches to optimize costs and speed
    private final Map<String, Map<String, Double>> geocodeCache = new ConcurrentHashMap<>();
    private final Map<String, String> reverseGeocodeCache = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> routeCache = new ConcurrentHashMap<>();

    // Token bucket rate limiting (10 requests per second burst, 2 requests refilled per second)
    private static final double BUCKET_CAPACITY = 10.0;
    private static final double REFILL_RATE_PER_SEC = 2.0;
    private double tokens = BUCKET_CAPACITY;
    private long lastRefillTime = System.currentTimeMillis();

    private synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        double elapsedSecs = (now - lastRefillTime) / 1000.0;
        lastRefillTime = now;
        tokens = Math.min(BUCKET_CAPACITY, tokens + elapsedSecs * REFILL_RATE_PER_SEC);
        if (tokens >= 1.0) {
            tokens -= 1.0;
            return true;
        }
        return false;
    }

    @Override
    public Map<String, Double> geocodeAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return Collections.emptyMap();
        }

        String cacheKey = address.trim().toLowerCase();
        if (geocodeCache.containsKey(cacheKey)) {
            log.info("Geocode cache hit for address: {}", address);
            return geocodeCache.get(cacheKey);
        }

        if (!tryAcquire()) {
            log.warn("Rate limit hit for Geocoding. Returning calculated fallback.");
            return getGeocodeFallback(address);
        }

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("API_KEY") || apiKey.contains("ENVIRONMENT")) {
            log.warn("Google Maps API key is not configured. Using fallback geocoding.");
            return getGeocodeFallback(address);
        }

        String url = String.format("https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s", 
                address.replace(" ", "%20"), apiKey);

        try {
            log.info("Calling Google Geocoding API for: {}", address);
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            if ("OK".equals(root.path("status").asText())) {
                JsonNode location = root.path("results").get(0).path("geometry").path("location");
                double lat = location.path("lat").asDouble();
                double lng = location.path("lng").asDouble();
                
                Map<String, Double> coords = new HashMap<>();
                coords.put("latitude", lat);
                coords.put("longitude", lng);
                
                geocodeCache.put(cacheKey, coords);
                return coords;
            } else {
                log.warn("Google Geocoding failed with status: {}. Using fallback.", root.path("status").asText());
                return getGeocodeFallback(address);
            }
        } catch (Exception e) {
            log.error("Error calling Geocoding API, using fallback", e);
            return getGeocodeFallback(address);
        }
    }

    @Override
    public String reverseGeocode(double lat, double lon) {
        // Round coordinates to 4 decimal places (approx 11m accuracy) for caching
        double roundedLat = Math.round(lat * 10000.0) / 10000.0;
        double roundedLon = Math.round(lon * 10000.0) / 10000.0;
        String cacheKey = String.format("%s,%s", roundedLat, roundedLon);

        if (reverseGeocodeCache.containsKey(cacheKey)) {
            log.info("Reverse geocode cache hit for coords: {}", cacheKey);
            return reverseGeocodeCache.get(cacheKey);
        }

        if (!tryAcquire()) {
            log.warn("Rate limit hit for Reverse Geocoding. Returning fallback.");
            return getReverseGeocodeFallback(lat, lon);
        }

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("API_KEY") || apiKey.contains("ENVIRONMENT")) {
            log.warn("Google Maps API key is not configured. Using fallback reverse geocoding.");
            return getReverseGeocodeFallback(lat, lon);
        }

        String url = String.format("https://maps.googleapis.com/maps/api/geocode/json?latlng=%s,%s&key=%s", 
                lat, lon, apiKey);

        try {
            log.info("Calling Google Reverse Geocoding API for coordinates: {}, {}", lat, lon);
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            if ("OK".equals(root.path("status").asText())) {
                String formattedAddress = root.path("results").get(0).path("formatted_address").asText();
                reverseGeocodeCache.put(cacheKey, formattedAddress);
                return formattedAddress;
            } else {
                log.warn("Google Reverse Geocoding failed with status: {}. Using fallback.", root.path("status").asText());
                return getReverseGeocodeFallback(lat, lon);
            }
        } catch (Exception e) {
            log.error("Error calling Reverse Geocoding API, using fallback", e);
            return getReverseGeocodeFallback(lat, lon);
        }
    }

    @Override
    public Map<String, Object> calculateDistance(double originLat, double originLon, double destLat, double destLon) {
        // Build route cache key rounded to 3 decimal places (approx 110m accuracy)
        double rOlat = Math.round(originLat * 1000.0) / 1000.0;
        double rOlon = Math.round(originLon * 1000.0) / 1000.0;
        double rDlat = Math.round(destLat * 1000.0) / 1000.0;
        double rDlon = Math.round(destLon * 1000.0) / 1000.0;
        String cacheKey = String.format("%s,%s:%s,%s", rOlat, rOlon, rDlat, rDlon);

        if (routeCache.containsKey(cacheKey)) {
            log.info("Route cache hit for points: {}", cacheKey);
            return routeCache.get(cacheKey);
        }

        if (!tryAcquire()) {
            log.warn("Rate limit hit for Directions. Returning mathematical fallback.");
            return getRouteFallback(originLat, originLon, destLat, destLon);
        }

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("API_KEY") || apiKey.contains("ENVIRONMENT")) {
            log.warn("Google Maps API key is not configured. Using fallback directions.");
            return getRouteFallback(originLat, originLon, destLat, destLon);
        }

        String url = String.format("https://maps.googleapis.com/maps/api/directions/json?origin=%s,%s&destination=%s,%s&key=%s", 
                originLat, originLon, destLat, destLon, apiKey);

        try {
            log.info("Calling Google Directions API for route: {},{} to {},{}", originLat, originLon, destLat, destLon);
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            if ("OK".equals(root.path("status").asText())) {
                JsonNode route = root.path("routes").get(0);
                JsonNode leg = route.path("legs").get(0);
                
                String distanceText = leg.path("distance").path("text").asText("0 km");
                long distanceValue = leg.path("distance").path("value").asLong(0); // in meters
                String durationText = leg.path("duration").path("text").asText("0 mins");
                long durationValue = leg.path("duration").path("value").asLong(0); // in seconds
                
                String polylinePoints = route.path("overview_polyline").path("points").asText("");

                Map<String, Object> result = new HashMap<>();
                result.put("distanceText", distanceText);
                result.put("distanceValue", distanceValue);
                result.put("durationText", durationText);
                result.put("durationValue", durationValue);
                result.put("polyline", polylinePoints);
                
                routeCache.put(cacheKey, result);
                return result;
            } else {
                log.warn("Google Directions failed with status: {}. Using fallback.", root.path("status").asText());
                return getRouteFallback(originLat, originLon, destLat, destLon);
            }
        } catch (Exception e) {
            log.error("Error calling Directions API, using fallback", e);
            return getRouteFallback(originLat, originLon, destLat, destLon);
        }
    }

    // Fallbacks for offline / local-dev without key
    private Map<String, Double> getGeocodeFallback(String address) {
        Map<String, Double> coords = new HashMap<>();
        // Default coordinates for major cities in India to make local-dev experience pleasant
        String addr = address.toLowerCase();
        if (addr.contains("bhopal")) {
            coords.put("latitude", 23.2599);
            coords.put("longitude", 77.4126);
        } else if (addr.contains("indore")) {
            coords.put("latitude", 22.7196);
            coords.put("longitude", 75.8577);
        } else if (addr.contains("delhi")) {
            coords.put("latitude", 28.6139);
            coords.put("longitude", 77.2090);
        } else if (addr.contains("mumbai")) {
            coords.put("latitude", 19.0760);
            coords.put("longitude", 72.8777);
        } else {
            // Default center of India (Jabalpur area)
            coords.put("latitude", 23.1670);
            coords.put("longitude", 79.9377);
        }
        return coords;
    }

    private String getReverseGeocodeFallback(double lat, double lon) {
        return String.format("Location near Coordinates (%.4f, %.4f), India", lat, lon);
    }

    private Map<String, Object> getRouteFallback(double originLat, double originLon, double destLat, double destLon) {
        double distance = calculateHaversineDistance(originLat, originLon, destLat, destLon);
        // Add 20% routing overhead to straight line distance
        double routingDistance = distance * 1.2; 
        
        // Assume average vehicle speed of 40 km/h
        double timeHours = routingDistance / 40.0;
        long timeSeconds = Math.round(timeHours * 3600);
        long distanceMeters = Math.round(routingDistance * 1000);

        long timeMins = timeSeconds / 60;

        Map<String, Object> result = new HashMap<>();
        result.put("distanceText", String.format("%.1f km", routingDistance));
        result.put("distanceValue", distanceMeters);
        result.put("durationText", String.format("%d mins", timeMins));
        result.put("durationValue", timeSeconds);
        // Simple straight polyline encoding for fallback
        result.put("polyline", ""); 

        return result;
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
