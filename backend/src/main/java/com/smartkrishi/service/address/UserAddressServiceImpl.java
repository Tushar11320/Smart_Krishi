package com.smartkrishi.service.address;

import com.smartkrishi.dto.address.UserAddressDTO;
import com.smartkrishi.entity.User;
import com.smartkrishi.entity.UserAddress;
import com.smartkrishi.exception.BadRequestException;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.UserAddressRepository;
import com.smartkrishi.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class UserAddressServiceImpl implements UserAddressService {

    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    public UserAddressDTO createAddress(UserAddressDTO addressDTO, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // If this is the first address or marked as default, set as default
        boolean isFirstAddress = addressRepository.findByUserId(user.getId()).isEmpty();
        boolean shouldBeDefault = isFirstAddress || (addressDTO.getIsDefault() != null && addressDTO.getIsDefault());

        // If setting as default, unset current default
        if (shouldBeDefault) {
            addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                    .ifPresent(addr -> {
                        addr.setIsDefault(false);
                        addressRepository.save(addr);
                    });
        }

        UserAddress address = new UserAddress();
        address.setUser(user);
        address.setAddressType(UserAddress.AddressType.valueOf(addressDTO.getAddressType().toUpperCase()));
        address.setFullName(addressDTO.getFullName());
        address.setMobileNumber(addressDTO.getMobileNumber());
        address.setAlternateMobileNumber(addressDTO.getAlternateMobileNumber());
        address.setHouseNumber(addressDTO.getHouseNumber());
        address.setStreet(addressDTO.getStreet());
        address.setLandmark(addressDTO.getLandmark());
        address.setVillage(addressDTO.getVillage());
        address.setCity(addressDTO.getCity());
        address.setLatitude(addressDTO.getLatitude());
        address.setLongitude(addressDTO.getLongitude());
        address.setDistrict(addressDTO.getDistrict());
        address.setState(addressDTO.getState());
        address.setPincode(addressDTO.getPincode());
        address.setCountry(addressDTO.getCountry() != null ? addressDTO.getCountry() : "India");
        address.setIsDefault(shouldBeDefault);

        UserAddress savedAddress = addressRepository.save(address);
        log.info("Created address for user: {}", user.getId());

        return mapToDTO(savedAddress);
    }

    @Override
    public UserAddressDTO updateAddress(Long id, UserAddressDTO addressDTO, Long userId) {
        UserAddress address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        address.setAddressType(UserAddress.AddressType.valueOf(addressDTO.getAddressType().toUpperCase()));
        address.setFullName(addressDTO.getFullName());
        address.setMobileNumber(addressDTO.getMobileNumber());
        address.setAlternateMobileNumber(addressDTO.getAlternateMobileNumber());
        address.setHouseNumber(addressDTO.getHouseNumber());
        address.setStreet(addressDTO.getStreet());
        address.setLandmark(addressDTO.getLandmark());
        address.setVillage(addressDTO.getVillage());
        address.setCity(addressDTO.getCity());
        address.setLatitude(addressDTO.getLatitude());
        address.setLongitude(addressDTO.getLongitude());
        address.setDistrict(addressDTO.getDistrict());
        address.setState(addressDTO.getState());
        address.setPincode(addressDTO.getPincode());
        address.setCountry(addressDTO.getCountry());

        UserAddress updatedAddress = addressRepository.save(address);
        log.info("Updated address: {}", id);

        return mapToDTO(updatedAddress);
    }

    @Override
    public void deleteAddress(Long id, Long userId) {
        UserAddress address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        if (address.getIsDefault()) {
            throw new BadRequestException("Cannot delete default address. Set another address as default first.");
        }

        addressRepository.delete(address);
        log.info("Deleted address: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public UserAddressDTO getAddressById(Long id, Long userId) {
        UserAddress address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        return mapToDTO(address);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserAddressDTO> getAddressesByUserId(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserAddressDTO getDefaultAddress(Long userId) {
        UserAddress address = addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No default address found for user"));
        return mapToDTO(address);
    }

    @Override
    public UserAddressDTO setDefaultAddress(Long userId, Long addressId) {
        UserAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        // Unset current default
        addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .ifPresent(addr -> {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                });

        // Set new default
        address.setIsDefault(true);
        UserAddress savedAddress = addressRepository.save(address);
        log.info("Set default address: {} for user: {}", addressId, userId);

        return mapToDTO(savedAddress);
    }

    private UserAddressDTO mapToDTO(UserAddress address) {
        return UserAddressDTO.builder()
                .id(address.getId())
                .userId(address.getUser().getId())
                .addressType(address.getAddressType().toString())
                .fullName(address.getFullName())
                .mobileNumber(address.getMobileNumber())
                .alternateMobileNumber(address.getAlternateMobileNumber())
                .houseNumber(address.getHouseNumber())
                .street(address.getStreet())
                .landmark(address.getLandmark())
                .village(address.getVillage())
                .city(address.getCity())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .district(address.getDistrict())
                .state(address.getState())
                .pincode(address.getPincode())
                .country(address.getCountry())
                .isDefault(address.getIsDefault())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
}
