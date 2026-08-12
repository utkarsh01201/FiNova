package com.finova.service.impl;

import com.finova.dto.PageResponse;
import com.finova.dto.TransactionDto;
import com.finova.dto.TransactionReceiptDto;
import com.finova.entity.Transaction;
import com.finova.entity.TransactionStatus;
import com.finova.entity.Wallet;
import com.finova.exception.BadRequestException;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.TransactionRepository;
import com.finova.repository.WalletRepository;
import com.finova.service.TransactionHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionHistoryServiceImpl implements TransactionHistoryService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Override
    public PageResponse<TransactionDto> getTransactionHistory(
            Long userId,
            TransactionStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            int page,
            int size) {

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));

        Pageable pageable = PageRequest.of(page, size);
        Page<Transaction> txPage = transactionRepository.filterTransactions(
                wallet.getId(), status, startDate, endDate, minAmount, maxAmount, pageable);

        List<TransactionDto> content = txPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PageResponse.<TransactionDto>builder()
                .content(content)
                .pageNo(txPage.getNumber())
                .pageSize(txPage.getSize())
                .totalElements(txPage.getTotalElements())
                .totalPages(txPage.getTotalPages())
                .last(txPage.isLast())
                .build();
    }

    @Override
    public TransactionReceiptDto getTransactionReceipt(Long userId, Long transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        boolean isSender = tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId);
        boolean isReceiver = tx.getReceiverWallet() != null && tx.getReceiverWallet().getUser().getId().equals(userId);

        if (!isSender && !isReceiver) {
            throw new BadRequestException("You do not have permission to access this receipt");
        }

        String senderName = tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getFullName() : "External Card / Bank";
        String senderUsername = tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getUsername() : "FINOVA_SYSTEM";
        String receiverName = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : "System Deposit Gateway";
        String receiverUsername = tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getUsername() : "FINOVA_SYSTEM";

        return TransactionReceiptDto.builder()
                .platformName("Finova Digital Wallet")
                .disclaimer("Official Finova Instant Payment Receipt. Encrypted & Verified.")
                .transactionReference(tx.getTransactionReference())
                .type(tx.getType())
                .status(tx.getStatus())
                .amount(tx.getAmount())
                .currency("INR")
                .senderName(senderName)
                .senderUsername(senderUsername)
                .receiverName(receiverName)
                .receiverUsername(receiverUsername)
                .description(tx.getDescription())
                .timestamp(tx.getCreatedAt())
                .build();
    }

    private TransactionDto mapToDto(Transaction tx) {
        return TransactionDto.builder()
                .id(tx.getId())
                .transactionReference(tx.getTransactionReference())
                .senderWalletId(tx.getSenderWallet() != null ? tx.getSenderWallet().getId() : null)
                .senderUsername(tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getUsername() : null)
                .senderFullName(tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getFullName() : null)
                .receiverWalletId(tx.getReceiverWallet() != null ? tx.getReceiverWallet().getId() : null)
                .receiverUsername(tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getUsername() : null)
                .receiverFullName(tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : null)
                .amount(tx.getAmount())
                .type(tx.getType())
                .status(tx.getStatus())
                .description(tx.getDescription())
                .fraudRiskScore(tx.getFraudRiskScore())
                .fraudRiskLevel(tx.getFraudRiskLevel())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
