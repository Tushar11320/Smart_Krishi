package com.smartkrishi.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateStatusRequest {
    private List<Long> ids;
    private String status;
}
