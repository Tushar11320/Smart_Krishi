package com.smartkrishi.repository;

import com.smartkrishi.entity.MachineryRentalBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MachineryRentalBookingRepository extends JpaRepository<MachineryRentalBooking, Long> {
    
    List<MachineryRentalBooking> findByMachineryId(Long machineryId);
    
    List<MachineryRentalBooking> findByBuyerId(Long buyerId);
    
    @Query("SELECT mrb FROM MachineryRentalBooking mrb JOIN mrb.machinery m JOIN m.product p WHERE p.seller.id = :sellerId")
    List<MachineryRentalBooking> findBySellerId(@Param("sellerId") Long sellerId);
    
    @Query("SELECT mrb FROM MachineryRentalBooking mrb WHERE mrb.machinery.id = :machineryId AND " +
           "mrb.bookingStatus <> 'CANCELLED' AND " +
           "((mrb.startDate <= :endDate AND mrb.endDate >= :startDate))")
    List<MachineryRentalBooking> findOverlappingBookings(
        @Param("machineryId") Long machineryId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
