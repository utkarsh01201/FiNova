package com.finova.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateMoneyRequest {

    @NotBlank(message = "Payer username, email, or phone number is required")
    private String payerIdentifier;

    @NotNull(message = "Request amount is required")
    @DecimalMin(value = "1.00", message = "Minimum request amount is ₹1.00")
    private BigDecimal amount;

    private String description;
}
