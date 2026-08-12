package com.finova.service.impl;

import com.finova.dto.AddMoneyRequest;
import com.finova.dto.TransactionDto;
import com.finova.dto.WalletDto;
import com.finova.entity.*;
import com.finova.exception.BadRequestException;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.BankAccountRepository;
import com.finova.repository.TransactionRepository;
import com.finova.repository.UserRepository;
import com.finova.repository.WalletRepository;
import com.finova.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class WalletServiceImpl implements WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public Wallet createWalletForUser(User user) {
        if (walletRepository.findByUser(user).isPresent()) {
            return walletRepository.findByUser(user).get();
        }

        Wallet wallet = Wallet.builder()
                .walletUuid(UUID.randomUUID().toString())
                .user(user)
                .balance(new BigDecimal("1000.00")) // Provision initial promo demo balance of ₹1,000.00
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        return walletRepository.save(wallet);
    }

    @Override
    public WalletDto getWalletByUserId(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));
        return mapToWalletDto(wallet);
    }

    @Override
    @Transactional
    public TransactionDto addMoney(Long userId, AddMoneyRequest request) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));

        if (wallet.getStatus() != WalletStatus.ACTIVE) {
            throw new BadRequestException("Cannot add money: Wallet is currently " + wallet.getStatus());
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid deposit amount");
        }

        // If depositing from Bank Account via UPI, verify PIN and deduct from bank account balance
        if (request.getBankAccountId() != null) {
            BankAccount bankAccount = bankAccountRepository.findByIdForUpdate(request.getBankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", request.getBankAccountId()));

            // Verify UPI PIN if provided
            if (request.getUpiPin() != null && !request.getUpiPin().isBlank()) {
                if (!passwordEncoder.matches(request.getUpiPin(), bankAccount.getUpiPinHash())) {
                    throw new BadRequestException("Incorrect UPI PIN! Bank deposit cancelled.");
                }
            }

            if (bankAccount.getBalance().compareTo(amount) < 0) {
                throw new BadRequestException("Insufficient bank balance! Available: ₹" + bankAccount.getBalance());
            }

            bankAccount.setBalance(bankAccount.getBalance().subtract(amount));
            bankAccountRepository.save(bankAccount);
        }

        // Update wallet balance
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        // Record transaction
        String desc = request.getPaymentSourceDescription() != null ? 
                request.getPaymentSourceDescription() : "Direct Wallet Top-Up";

        Transaction transaction = Transaction.builder()
                .transactionReference(UUID.randomUUID().toString())
                .receiverWallet(wallet)
                .senderWallet(null) // Top-up has no sender wallet
                .amount(amount)
                .type(TransactionType.ADD_MONEY)
                .status(TransactionStatus.SUCCESS)
                .description(desc)
                .fraudRiskScore(0.0)
                .fraudRiskLevel("LOW")
                .build();

        Transaction savedTx = transactionRepository.save(transaction);
        return mapToTransactionDto(savedTx);
    }

    @Override
    @Transactional
    public TransactionDto withdrawToBank(Long userId, com.finova.dto.WithdrawToBankRequest request) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));

        if (wallet.getStatus() != WalletStatus.ACTIVE) {
            throw new BadRequestException("Cannot withdraw: Wallet is currently " + wallet.getStatus());
        }

        BankAccount bankAccount = bankAccountRepository.findByIdForUpdate(request.getBankAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", request.getBankAccountId()));

        if (!bankAccount.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized bank account access");
        }

        // Verify UPI PIN
        if (!passwordEncoder.matches(request.getUpiPin(), bankAccount.getUpiPinHash())) {
            throw new BadRequestException("Incorrect UPI PIN! Withdrawal cancelled.");
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid withdrawal amount");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient wallet balance! Available: ₹" + wallet.getBalance());
        }

        // Deduct from wallet
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        // Credit bank account
        bankAccount.setBalance(bankAccount.getBalance().add(amount));
        bankAccountRepository.save(bankAccount);

        // Record transaction
        String desc = request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription()
                : "Wallet Withdrawal to " + bankAccount.getBankName() + " (" + bankAccount.getUpiId() + ")";

        Transaction transaction = Transaction.builder()
                .transactionReference(UUID.randomUUID().toString())
                .senderWallet(wallet)
                .receiverWallet(null)
                .senderBankAccountId(null)
                .receiverBankAccountId(bankAccount.getId())
                .amount(amount)
                .type(TransactionType.WITHDRAW)
                .status(TransactionStatus.SUCCESS)
                .description(desc)
                .paymentMethod("WALLET_TO_BANK")
                .upiId(bankAccount.getUpiId())
                .fraudRiskScore(0.0)
                .fraudRiskLevel("LOW")
                .build();

        Transaction savedTx = transactionRepository.save(transaction);
        return mapToTransactionDto(savedTx);
    }

    private WalletDto mapToWalletDto(Wallet wallet) {

        return WalletDto.builder()
                .id(wallet.getId())
                .walletUuid(wallet.getWalletUuid())
                .userId(wallet.getUser().getId())
                .username(wallet.getUser().getUsername())
                .fullName(wallet.getUser().getFullName())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .status(wallet.getStatus())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
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
                .receiverUsername(tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getUsername() : "Finova Bank")
                .receiverFullName(tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getFullName() : "Finova Direct Payment Gateway")
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
