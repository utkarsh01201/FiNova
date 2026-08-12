package com.finova.dto;

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
public class BankAccountDto {

    private Long id;
    private Long userId;
    private String bankName;
    private String accountNumberMasked;
    private String ifscCode;
    private String accountHolderName;
    private String upiId;
    private BigDecimal balance; // Exposed only upon UPI PIN verification
    private Boolean isPrimary;
    private String status;
    private LocalDateTime createdAt;
}
