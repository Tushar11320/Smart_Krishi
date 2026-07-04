package com.smartkrishi.repository;

import com.smartkrishi.entity.DeliveryZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, Long> {
    Optional<DeliveryZone> findBySellerId(Long sellerId);
}
