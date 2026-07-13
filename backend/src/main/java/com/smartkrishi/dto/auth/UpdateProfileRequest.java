package com.smartkrishi.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(?:\\+91)?[6-9]\\d{9}$", message = "Please enter a valid Indian phone number.")
    private String phone;

    public void setPhone(String phone) {
        this.phone = phone != null ? phone.trim() : null;
    }

    private String profileImage;
}
