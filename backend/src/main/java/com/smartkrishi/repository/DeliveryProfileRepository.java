package com.smartkrishi.repository;

import com.smartkrishi.entity.DeliveryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryProfileRepository extends JpaRepository<DeliveryProfile, Long> {
    Optional<DeliveryProfile> findByUserId(Long userId);
}
