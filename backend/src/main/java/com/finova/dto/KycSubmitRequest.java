package com.finova.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class KycSubmitRequest {

    @NotBlank(message = "Aadhaar number is mandatory")
    @Pattern(regexp = "^[0-9]{12}$|^[0-9]{16}$", message = "Aadhaar must be a 12-digit Aadhaar number or 16-digit Virtual ID")
    private String aadhaarNumber;

    @NotBlank(message = "PAN card number is mandatory")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Invalid PAN card structure. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)")
    private String panNumber;

    private String livePhotoData; // Base64 or image URL
}
