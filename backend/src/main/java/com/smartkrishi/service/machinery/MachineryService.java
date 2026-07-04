package com.smartkrishi.service.machinery;

import com.smartkrishi.dto.machinery.MachineryDTO;
import com.smartkrishi.dto.machinery.MachineryRentalBookingDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.List;

public interface MachineryService {
    MachineryDTO createMachinery(MachineryDTO machineryDTO);
    MachineryDTO getMachineryById(Long id);
    Page<MachineryDTO> getAllMachinery(Pageable pageable);
    Page<MachineryDTO> getMachineryByType(String type, Pageable pageable);
    Page<MachineryDTO> getMachineryByBrand(String brand, Pageable pageable);
    MachineryDTO updateMachinery(Long id, MachineryDTO machineryDTO);
    void deleteMachinery(Long id);
    MachineryDTO getMachineryByProductId(Long productId);

    Page<MachineryDTO> getMachineryFiltered(
            String keyword,
            String brand,
            String category,
            String state,
            String condition,
            Boolean forSale,
            Boolean forRent,
            BigDecimal maxPrice,
            Pageable pageable
    );

    // Rental Booking operations
    MachineryRentalBookingDTO bookRental(MachineryRentalBookingDTO dto);
    List<MachineryRentalBookingDTO> getBookingsByBuyerId(Long buyerId);
    List<MachineryRentalBookingDTO> getBookingsBySellerId(Long sellerId);
    List<MachineryRentalBookingDTO> getBookingsByMachineryId(Long machineryId);
    MachineryRentalBookingDTO updateBookingStatus(Long bookingId, String status);
}
