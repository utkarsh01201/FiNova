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
public class AdminAnalyticsDto {

    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private BigDecimal totalVirtualMoneyTransferred;
    private long totalTransactions;
    private long successfulTransactions;
    private long blockedTransactions;
    private long highRiskFraudAlerts;
}
