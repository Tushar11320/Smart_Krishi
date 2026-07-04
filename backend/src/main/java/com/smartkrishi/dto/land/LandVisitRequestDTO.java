package com.smartkrishi.dto.land;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LandVisitRequestDTO {

    private Long id;

    @NotNull(message = "Land listing ID is required")
    private Long landListingId;

    private String landTitle;

    @NotNull(message = "Buyer ID is required")
    private Long buyerId;

    @NotBlank(message = "Name is required")
    private String buyerName;

    @NotBlank(message = "Phone number is required")
    private String buyerPhone;

    @NotBlank(message = "Email is required")
    private String buyerEmail;

    @NotNull(message = "Visit date is required")
    private LocalDate visitDate;

    @NotBlank(message = "Visit time is required")
    private String visitTime;

    private String message;

    private String requestStatus;

    private LocalDateTime createdAt;
}
