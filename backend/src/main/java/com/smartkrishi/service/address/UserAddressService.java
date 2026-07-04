package com.smartkrishi.service.address;

import com.smartkrishi.dto.address.UserAddressDTO;

import java.util.List;

public interface UserAddressService {
    
    UserAddressDTO createAddress(UserAddressDTO addressDTO, Long userId);
    
    UserAddressDTO updateAddress(Long id, UserAddressDTO addressDTO, Long userId);
    
    void deleteAddress(Long id, Long userId);
    
    UserAddressDTO getAddressById(Long id, Long userId);
    
    List<UserAddressDTO> getAddressesByUserId(Long userId);
    
    UserAddressDTO getDefaultAddress(Long userId);
    
    UserAddressDTO setDefaultAddress(Long userId, Long addressId);
}
