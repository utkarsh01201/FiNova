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
public class TransactionReceiptDto {

    @Builder.Default
    private String platformName = "Finova Digital Wallet";
    @Builder.Default
    private String disclaimer = "Official Finova Instant Payment Receipt. Encrypted & Verified.";
    private String transactionReference;
    private TransactionType type;
    private TransactionStatus status;
    private BigDecimal amount;
    private String currency;
    private String senderName;
    private String senderUsername;
    private String receiverName;
    private String receiverUsername;
    private String description;
    private LocalDateTime timestamp;
}
