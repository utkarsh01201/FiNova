package com.finova.dto;

import com.finova.entity.RequestStatus;
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
public class MoneyRequestDto {

    private Long id;
    private String requestReference;
    private Long requesterId;
    private String requesterUsername;
    private String requesterFullName;
    private Long payerId;
    private String payerUsername;
    private String payerFullName;
    private BigDecimal amount;
    private String description;
    private RequestStatus status;
    private Long transactionId;
    private String transactionReference;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
