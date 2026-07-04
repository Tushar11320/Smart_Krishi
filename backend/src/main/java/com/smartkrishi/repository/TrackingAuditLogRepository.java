package com.smartkrishi.repository;

import com.smartkrishi.entity.TrackingAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrackingAuditLogRepository extends JpaRepository<TrackingAuditLog, Long> {
    List<TrackingAuditLog> findByOrderId(Long orderId);
}
