package com.smartkrishi.repository;

import com.smartkrishi.entity.WeatherCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeatherCacheRepository extends JpaRepository<WeatherCache, Long> {
    Optional<WeatherCache> findByCityIgnoreCase(String city);
    void deleteByCityIgnoreCase(String city);
}
