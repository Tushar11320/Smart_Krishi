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

    @GetMapping("/favicon.ico")
    public org.springframework.http.ResponseEntity<Void> returnNoFavicon() {
        return org.springframework.http.ResponseEntity.noContent().build();
    }
}
