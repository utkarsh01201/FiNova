package com.finova.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class GameSpinRequest {

    @NotNull(message = "Bet amount is required")
    @DecimalMin(value = "1.00", message = "Minimum bet is ₹1.00")
    private BigDecimal betAmount;
}
