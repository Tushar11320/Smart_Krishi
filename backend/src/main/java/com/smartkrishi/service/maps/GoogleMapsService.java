package com.smartkrishi.service.maps;

import java.util.Map;

public interface GoogleMapsService {
    Map<String, Double> geocodeAddress(String address);
    String reverseGeocode(double lat, double lon);
    Map<String, Object> calculateDistance(double originLat, double originLon, double destLat, double destLon);
}
