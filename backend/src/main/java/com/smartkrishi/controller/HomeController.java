package com.smartkrishi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Smart Krishi Backend Running";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @GetMapping("/api/health")
    public java.util.Map<String, String> apiHealth() {
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("status", "ok");
        return response;
    }

    @GetMapping("/favicon.ico")
    public org.springframework.http.ResponseEntity<Void> returnNoFavicon() {
        return org.springframework.http.ResponseEntity.noContent().build();
    }
}
