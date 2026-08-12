package com.finova.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AddMoneyRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Minimum deposit amount is ₹1.00")
    private BigDecimal amount;

    private Long bankAccountId; // Optional linked bank account ID for UPI deposit

    private String upiPin; // Optional UPI PIN for bank-to-wallet verification

    private String paymentSourceDescription; // e.g. "Simulated Card Ending 4242"
}
