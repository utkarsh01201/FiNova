package com.finova.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LinkBankRequest {

    @NotBlank(message = "Bank name is required")
    private String bankName; // e.g. HDFC Bank, SBI, ICICI Bank

    @NotBlank(message = "Account number is required")
    @Size(min = 6, max = 20, message = "Account number must be between 6 and 20 digits")
    private String accountNumber;

    @NotBlank(message = "IFSC Code is required")
    @Pattern(regexp = "^[A-Za-z0-9]{8,15}$", message = "IFSC Code must be 8 to 15 alphanumeric characters (e.g. SBIN0001234)")
    private String ifscCode;

    @NotBlank(message = "Account holder name is required")
    private String accountHolderName;

    @NotBlank(message = "UPI ID handle is required")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$", message = "UPI ID format e.g. username@finova")
    private String upiId;

    @NotBlank(message = "UPI PIN is required")
    @Pattern(regexp = "^[0-9]{4,6}$", message = "UPI PIN must be 4 to 6 numeric digits")
    private String upiPin;
}
