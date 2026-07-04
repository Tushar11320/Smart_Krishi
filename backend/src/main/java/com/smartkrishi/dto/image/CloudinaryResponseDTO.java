package com.smartkrishi.dto.image;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloudinaryResponseDTO {
    private String secureUrl;
    private String publicId;
    private String format;
    private Integer width;
    private Integer height;
}
