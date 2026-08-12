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
public class FraudAssessmentRequest {

    private Long transactionId;
    private Long senderId;
    private Long receiverId;
    private BigDecimal amount;
    private int recentTxCount;
    private double amountDeviationRatio;
    private int isNewRecipient;
    private int hourOfDay;
}
