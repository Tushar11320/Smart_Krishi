package com.smartkrishi.dto.feedback;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FeedbackDTO {
    
    private Long id;
    
    private Long userId;
    
    private String userName;
    
    private String userEmail;
    
    @NotBlank(message = "Category is required")
    private String category;
    
    @NotBlank(message = "Subject is required")
    private String subject;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    private String screenshotUrl;
    
    private String status;
    
    private String priority;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
