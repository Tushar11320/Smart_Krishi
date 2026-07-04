package com.smartkrishi.repository;

import com.smartkrishi.entity.RentalBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RentalBookingRepository extends JpaRepository<RentalBooking, Long> {

    List<RentalBooking> findByFarmingEquipmentId(Long equipmentId);

    List<RentalBooking> findByBuyerId(Long buyerId);

    @Query("SELECT rb FROM RentalBooking rb JOIN rb.farmingEquipment fe JOIN fe.product p WHERE p.seller.id = :sellerId")
    List<RentalBooking> findBySellerId(@Param("sellerId") Long sellerId);

    @Query("SELECT rb FROM RentalBooking rb WHERE rb.farmingEquipment.id = :equipmentId AND " +
           "rb.bookingStatus <> 'CANCELLED' AND " +
           "rb.startDate <= :endDate AND rb.endDate >= :startDate")
    List<RentalBooking> findOverlappingBookings(
        @Param("equipmentId") Long equipmentId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
