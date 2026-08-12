package com.finova.service.impl;

import com.finova.dto.AdminAnalyticsDto;
import com.finova.dto.PageResponse;
import com.finova.dto.TransactionDto;
import com.finova.dto.UserDto;
import com.finova.entity.Role;
import com.finova.entity.Transaction;
import com.finova.entity.TransactionStatus;
import com.finova.entity.User;
import com.finova.entity.UserStatus;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.TransactionRepository;
import com.finova.repository.UserRepository;
import com.finova.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Override
    public AdminAnalyticsDto getSystemAnalytics() {
        List<User> users = userRepository.findAll();
        List<Transaction> transactions = transactionRepository.findAll();

        long totalUsers = users.size();
        long activeUsers = users.stream().filter(u -> u.getStatus() == UserStatus.ACTIVE).count();
        long suspendedUsers = users.stream().filter(u -> u.getStatus() != UserStatus.ACTIVE).count();

        long totalTx = transactions.size();
        long successTx = transactions.stream().filter(t -> t.getStatus() == TransactionStatus.SUCCESS).count();
        long blockedTx = transactions.stream().filter(t -> t.getStatus() == TransactionStatus.BLOCKED).count();
        long highRisk = transactions.stream().filter(t -> "HIGH".equalsIgnoreCase(t.getFraudRiskLevel())).count();

        BigDecimal totalMoney = transactions.stream()
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminAnalyticsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .suspendedUsers(suspendedUsers)
                .totalVirtualMoneyTransferred(totalMoney)
                .totalTransactions(totalTx)
                .successfulTransactions(successTx)
                .blockedTransactions(blockedTx)
                .highRiskFraudAlerts(highRisk)
                .build();
    }

    @Override
    public PageResponse<UserDto> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.findAll(pageable);

        List<UserDto> content = userPage.getContent().stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());

        return PageResponse.<UserDto>builder()
                .content(content)
                .pageNo(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public UserDto updateUserAccountStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setStatus(status);
        User updated = userRepository.save(user);
        return mapToUserDto(updated);
    }

    @Override
    public PageResponse<TransactionDto> getAllSystemTransactions(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Transaction> txPage = transactionRepository.findAll(pageable);

        List<TransactionDto> content = txPage.getContent().stream()
                .map(this::mapToTransactionDto)
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

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .kycStatus(user.getKycStatus())
                .status(user.getStatus())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private TransactionDto mapToTransactionDto(Transaction tx) {
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
