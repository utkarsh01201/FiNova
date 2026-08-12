package com.finova.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckBalanceRequest {

    @NotNull(message = "Bank account ID is required")
    private Long bankAccountId;

    @NotBlank(message = "UPI PIN is required to check balance")
    private String upiPin;
}
