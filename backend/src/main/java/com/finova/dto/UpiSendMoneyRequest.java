package com.finova.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpiSendMoneyRequest {

    @NotNull(message = "Source bank account ID is required")
    private Long bankAccountId;

    @NotBlank(message = "Recipient UPI ID, Phone Number, or Username is required")
    private String recipientUpiOrIdentifier;

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(value = "1.00", message = "Minimum transfer amount is ₹1.00")
    private BigDecimal amount;

    @NotBlank(message = "Secret UPI PIN is required")
    private String upiPin;

    private String description;
}
