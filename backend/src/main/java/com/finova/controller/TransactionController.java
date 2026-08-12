package com.finova.controller;

import com.finova.dto.*;
import com.finova.entity.TransactionStatus;
import com.finova.security.CurrentUser;
import com.finova.security.UserPrincipal;
import com.finova.service.TransactionHistoryService;
import com.finova.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransferService transferService;

    @Autowired
    private TransactionHistoryService transactionHistoryService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<TransactionDto>> sendMoney(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody SendMoneyRequest request) {
        TransactionDto transaction = transferService.sendMoney(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Virtual money sent successfully", transaction));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TransactionDto>>> getTransactionHistory(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(value = "status", required = false) TransactionStatus status,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(value = "minAmount", required = false) BigDecimal minAmount,
            @RequestParam(value = "maxAmount", required = false) BigDecimal maxAmount,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        PageResponse<TransactionDto> history = transactionHistoryService.getTransactionHistory(
                currentUser.getId(), status, startDate, endDate, minAmount, maxAmount, page, size);
        return ResponseEntity.ok(ApiResponse.success("Transaction history retrieved", history));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionDto>> getTransactionDetails(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable("id") Long transactionId) {
        TransactionDto transaction = transferService.getTransactionById(currentUser.getId(), transactionId);
        return ResponseEntity.ok(ApiResponse.success("Transaction details retrieved", transaction));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<ApiResponse<TransactionReceiptDto>> getTransactionReceipt(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable("id") Long transactionId) {
        TransactionReceiptDto receipt = transactionHistoryService.getTransactionReceipt(currentUser.getId(), transactionId);
        return ResponseEntity.ok(ApiResponse.success("Transaction receipt generated", receipt));
    }
}
