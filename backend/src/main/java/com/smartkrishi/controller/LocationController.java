package com.smartkrishi.controller;

import com.smartkrishi.dto.common.ApiResponse;
import com.smartkrishi.entity.User;
import com.smartkrishi.entity.DeliveryZone;
import com.smartkrishi.repository.UserRepository;
import com.smartkrishi.repository.DeliveryZoneRepository;
import com.smartkrishi.security.UserPrincipal;
import com.smartkrishi.service.maps.GoogleMapsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
@Tag(name = "Location & Maps", description = "APIs for Google Maps utilities, geocoding, routing, and user geolocation")
public class LocationController {

    private final GoogleMapsService googleMapsService;
    private final UserRepository userRepository;
    private final DeliveryZoneRepository deliveryZoneRepository;

    @PostMapping("/location/save")
    @Operation(summary = "Save user's current GPS location coordinates")
    public ResponseEntity<ApiResponse<Map<String, Double>>> saveUserLocation(
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        Map<String, Double> coords = new HashMap<>();
        coords.put("latitude", lat);
        coords.put("longitude", lon);

        if (userPrincipal != null) {
            Optional<User> userOpt = userRepository.findById(userPrincipal.getId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setLatitude(lat);
                user.setLongitude(lon);
                userRepository.save(user);
                log.info("Saved GPS location coordinates for user: {}", user.getId());
            }
        } else {
            log.info("Anonymous user saving coordinates: lat={}, lon={}", lat, lon);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Current position coordinates saved successfully", coords));
    }

    @GetMapping("/location/current")
    @Operation(summary = "Get user's current saved coordinates")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserLocation(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        Map<String, Object> result = new HashMap<>();
        
        if (userPrincipal != null) {
            Optional<User> userOpt = userRepository.findById(userPrincipal.getId());
            if (userOpt.isPresent() && userOpt.get().getLatitude() != null && userOpt.get().getLongitude() != null) {
                User user = userOpt.get();
                result.put("latitude", user.getLatitude());
                result.put("longitude", user.getLongitude());
                result.put("authenticated", true);
                return ResponseEntity.ok(new ApiResponse<>(true, "Saved coordinates retrieved successfully", result));
            }
        }
        
        // Default fallback (Bhopal coordinates)
        result.put("latitude", 23.2599);
        result.put("longitude", 77.4126);
        result.put("authenticated", userPrincipal != null);
        result.put("fallback", true);
        return ResponseEntity.ok(new ApiResponse<>(true, "No saved coordinates found. Returning default location.", result));
    }

    @GetMapping("/maps/geocode")
    @Operation(summary = "Resolve address string to latitude/longitude coordinates")
    public ResponseEntity<ApiResponse<Map<String, Double>>> geocodeAddress(
            @RequestParam("address") String address) {
        Map<String, Double> coords = googleMapsService.geocodeAddress(address);
        if (coords.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Address coordinates could not be resolved", null));
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Address coordinates resolved successfully", coords));
    }

    @GetMapping("/maps/reverse-geocode")
    @Operation(summary = "Resolve coordinates (lat, lon) to a formatted postal address")
    public ResponseEntity<ApiResponse<String>> reverseGeocode(
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon) {
        String address = googleMapsService.reverseGeocode(lat, lon);
        return ResponseEntity.ok(new ApiResponse<>(true, "Formatted address resolved successfully", address));
    }

    @GetMapping("/maps/distance")
    @Operation(summary = "Calculate distance, travel time, and route polyline using Directions API")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateDistance(
            @RequestParam("originLat") double originLat,
            @RequestParam("originLon") double originLon,
            @RequestParam("destLat") double destLat,
            @RequestParam("destLon") double destLon) {
        Map<String, Object> route = googleMapsService.calculateDistance(originLat, originLon, destLat, destLon);
        return ResponseEntity.ok(new ApiResponse<>(true, "Route calculations completed successfully", route));
    }

    @PostMapping("/location/delivery-zone")
    @Operation(summary = "Set seller's delivery serviceability zone center and radius")
    public ResponseEntity<ApiResponse<DeliveryZone>> setDeliveryZone(
            @RequestParam("sellerId") Long sellerId,
            @RequestParam("radiusKm") double radiusKm,
            @RequestParam("centerLat") double centerLat,
            @RequestParam("centerLon") double centerLon) {
        
        Optional<DeliveryZone> zoneOpt = deliveryZoneRepository.findBySellerId(sellerId);
        DeliveryZone zone = zoneOpt.orElse(new DeliveryZone());
        zone.setSellerId(sellerId);
        zone.setRadiusKm(radiusKm);
        zone.setCenterLatitude(centerLat);
        zone.setCenterLongitude(centerLon);
        
        DeliveryZone saved = deliveryZoneRepository.save(zone);
        log.info("Saved delivery zone for seller: {} (radius = {} km)", sellerId, radiusKm);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Delivery service zone updated successfully", saved));
    }

    @GetMapping("/location/delivery-zone/check")
    @Operation(summary = "Check if customer coordinates are serviceable by a seller")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkServiceability(
            @RequestParam("sellerId") Long sellerId,
            @RequestParam("customerLat") double customerLat,
            @RequestParam("customerLon") double customerLon) {
        
        Optional<DeliveryZone> zoneOpt = deliveryZoneRepository.findBySellerId(sellerId);
        Map<String, Object> result = new HashMap<>();
        
        if (zoneOpt.isEmpty()) {
            result.put("serviceable", true);
            result.put("message", "Seller has not defined service zones. Assuming serviceable.");
            return ResponseEntity.ok(new ApiResponse<>(true, "Serviceability check completed", result));
        }
        
        DeliveryZone zone = zoneOpt.get();
        double distance = calculateHaversineDistance(zone.getCenterLatitude(), zone.getCenterLongitude(), customerLat, customerLon);
        boolean serviceable = distance <= zone.getRadiusKm();
        
        result.put("serviceable", serviceable);
        result.put("distanceKm", Math.round(distance * 100.0) / 100.0);
        result.put("radiusKm", zone.getRadiusKm());
        result.put("message", serviceable ? "Address is within seller's delivery range" : "Address is outside seller's delivery range");
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Serviceability check completed", result));
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
