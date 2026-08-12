package com.finova.dto;

import com.finova.entity.TransactionStatus;
import com.finova.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {

    private Long id;
    private String transactionReference;
    private Long senderWalletId;
    private String senderUsername;
    private String senderFullName;
    private Long receiverWalletId;
    private String receiverUsername;
    private String receiverFullName;
    private BigDecimal amount;
    private TransactionType type;
    private TransactionStatus status;
    private String description;
    private Double fraudRiskScore;
    private String fraudRiskLevel;
    private LocalDateTime createdAt;
}
