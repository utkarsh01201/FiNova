package com.finova.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameSpinResult {
    private String outcome;          // "WIN" or "LOSS"
    private String segment;          // e.g. "2x", "JACKPOT", "LOSE"
    private double multiplier;       // 0.0 = loss, 1.5, 2.0, 5.0, 10.0 etc.
    private BigDecimal betAmount;
    private BigDecimal winAmount;    // 0 if loss
    private BigDecimal newBalance;
    private String message;
    private Long transactionId;
    private int spinIndex;           // which wheel segment (0-7) for animation
}
