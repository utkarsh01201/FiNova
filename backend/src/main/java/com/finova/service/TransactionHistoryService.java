package com.finova.service;

import com.finova.dto.PageResponse;
import com.finova.dto.TransactionDto;
import com.finova.dto.TransactionReceiptDto;
import com.finova.entity.TransactionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface TransactionHistoryService {

    PageResponse<TransactionDto> getTransactionHistory(
            Long userId,
            TransactionStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            int page,
            int size);

    TransactionReceiptDto getTransactionReceipt(Long userId, Long transactionId);
}
