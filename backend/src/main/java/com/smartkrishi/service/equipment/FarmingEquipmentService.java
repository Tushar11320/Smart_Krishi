package com.smartkrishi.service.equipment;

import com.smartkrishi.dto.equipment.FarmingEquipmentDTO;
import com.smartkrishi.dto.equipment.RentalBookingDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface FarmingEquipmentService {

    FarmingEquipmentDTO createEquipment(FarmingEquipmentDTO dto);

    FarmingEquipmentDTO getEquipmentById(Long id);

    FarmingEquipmentDTO getEquipmentByProductId(Long productId);

    Page<FarmingEquipmentDTO> getAllEquipment(Pageable pageable);

    FarmingEquipmentDTO updateEquipment(Long id, FarmingEquipmentDTO dto);

    void deleteEquipment(Long id);

    Page<FarmingEquipmentDTO> getEquipmentFiltered(
            String keyword, String brand, String condition,
            Boolean forSale, Boolean forRent, BigDecimal maxPrice,
            Pageable pageable
    );

    // Renting and Booking operations
    RentalBookingDTO bookRental(RentalBookingDTO dto);

    List<RentalBookingDTO> getBookingsByEquipmentId(Long equipmentId);

    List<RentalBookingDTO> getBookingsByBuyerId(Long buyerId);

    List<RentalBookingDTO> getBookingsBySellerId(Long sellerId);

    RentalBookingDTO updateBookingStatus(Long bookingId, String status);
}
