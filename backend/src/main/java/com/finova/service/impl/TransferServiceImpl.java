package com.finova.service.impl;

import com.finova.dto.FraudAssessmentResponse;
import com.finova.dto.SendMoneyRequest;
import com.finova.dto.TransactionDto;
import com.finova.entity.*;
import com.finova.exception.BadRequestException;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.BankAccountRepository;
import com.finova.repository.TransactionRepository;
import com.finova.repository.UserRepository;
import com.finova.repository.WalletRepository;
import com.finova.service.FraudDetectionClientService;
import com.finova.service.NotificationService;
import com.finova.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TransferServiceImpl implements TransferService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private FraudDetectionClientService fraudDetectionClientService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public TransactionDto sendMoney(Long senderUserId, SendMoneyRequest request) {
        User senderUser = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderUserId));

        String recipientIdentifier = request.getRecipientIdentifier().trim();
        User receiverUser = resolveRecipientUser(recipientIdentifier, senderUser);

        if (receiverUser.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Recipient account is currently " + receiverUser.getStatus());
        }

        // Verify Mandatory Payment PIN
        if (senderUser.getTransactionPinHash() == null || senderUser.getTransactionPinHash().isBlank()) {
            throw new BadRequestException("Payment PIN not configured. Please set your 4-digit Payment PIN before transferring funds.");
        }

        if (request.getPin() == null || !passwordEncoder.matches(request.getPin(), senderUser.getTransactionPinHash())) {
            throw new BadRequestException("Incorrect Payment PIN! Transaction cancelled.");
        }

        // Lock wallets using Pessimistic Lock
        Wallet senderWallet = walletRepository.findByUserIdForUpdate(senderUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender Wallet", "userId", senderUser.getId()));

        Wallet receiverWallet = walletRepository.findByUserIdForUpdate(receiverUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver Wallet", "userId", receiverUser.getId()));

        if (senderWallet.getStatus() != WalletStatus.ACTIVE) {
            throw new BadRequestException("Your wallet is currently " + senderWallet.getStatus());
        }

        if (receiverWallet.getStatus() != WalletStatus.ACTIVE) {
            throw new BadRequestException("Recipient wallet is currently " + receiverWallet.getStatus());
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid transfer amount");
        }

        if (senderWallet.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient wallet balance! Current balance: ₹" + senderWallet.getBalance());
        }

        // Evaluate Fraud Risk with AI Microservice
        FraudAssessmentResponse fraudRisk = fraudDetectionClientService.evaluateTransactionRisk(senderUser, receiverUser, amount);

        if ("BLOCK".equalsIgnoreCase(fraudRisk.getDecision())) {
            Transaction blockedTx = Transaction.builder()
                    .transactionReference(UUID.randomUUID().toString())
                    .senderWallet(senderWallet)
                    .receiverWallet(receiverWallet)
                    .amount(amount)
                    .type(TransactionType.SEND_MONEY)
                    .status(TransactionStatus.BLOCKED)
                    .description("Blocked by Finova AI Fraud Detection System")
                    .fraudRiskScore(fraudRisk.getRiskScore())
                    .fraudRiskLevel(fraudRisk.getRiskLevel())
                    .build();

            transactionRepository.save(blockedTx);
            throw new BadRequestException("Transaction blocked by AI Fraud System due to high risk score (" + fraudRisk.getRiskScore() + ")");
        }

        // Execute Transfer
        boolean isSelfTransfer = senderUser.getId().equals(receiverUser.getId());
        if (!isSelfTransfer) {
            senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
            receiverWallet.setBalance(receiverWallet.getBalance().add(amount));
            walletRepository.save(senderWallet);
            walletRepository.save(receiverWallet);
        }

        String noteDesc = request.getDescription() != null && !request.getDescription().isBlank() ?
                request.getDescription() : (isSelfTransfer ? "Self Wallet Transfer to " + recipientIdentifier : "Transfer to " + recipientIdentifier);

        // Record Successful Transaction
        Transaction transaction = Transaction.builder()
                .transactionReference(UUID.randomUUID().toString())
                .senderWallet(senderWallet)
                .receiverWallet(receiverWallet)
                .amount(amount)
                .type(TransactionType.SEND_MONEY)
                .status(TransactionStatus.SUCCESS)
                .description(noteDesc)
                .fraudRiskScore(fraudRisk.getRiskScore())
                .fraudRiskLevel(fraudRisk.getRiskLevel())
                .build();

        Transaction savedTx = transactionRepository.save(transaction);

        // Send Push Notifications
        if (!isSelfTransfer) {
            notificationService.sendNotification(senderUser, "Money Transferred",
                    "Sent ₹" + amount + " to " + receiverUser.getFullName() + " (@" + receiverUser.getUsername() + ").", NotificationType.TRANSACTION);

            notificationService.sendNotification(receiverUser, "Money Received",
                    "Received ₹" + amount + " from " + senderUser.getFullName() + " (@" + senderUser.getUsername() + ").", NotificationType.TRANSACTION);
        } else {
            notificationService.sendNotification(senderUser, "Self Transfer Processed",
                    "Self UPI payment of ₹" + amount + " processed to handle " + recipientIdentifier + ".", NotificationType.TRANSACTION);
        }

        return mapToTransactionDto(savedTx);
    }

    @Override
    public TransactionDto getTransactionById(Long userId, Long transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        // Verify the user is either the sender or receiver of this transaction
        boolean isSender = tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(userId);
        boolean isReceiver = tx.getReceiverWallet() != null && tx.getReceiverWallet().getUser().getId().equals(userId);
        boolean isBankRelated = tx.getSenderBankAccountId() != null || tx.getReceiverBankAccountId() != null;

        if (!isSender && !isReceiver && !isBankRelated) {
            throw new BadRequestException("Unauthorized access to transaction");
        }

        return mapToTransactionDto(tx);
    }

    private User resolveRecipientUser(String identifier, User senderUser) {
        String query = identifier.trim();

        // 1. Direct match by username, email, phone
        Optional<User> directOpt = userRepository.findByUsernameOrEmailOrPhoneNumber(query, query, query);
        if (directOpt.isPresent()) return directOpt.get();

        // 2. Check bank accounts by UPI ID
        Optional<BankAccount> bankOpt = bankAccountRepository.findByUpiId(query);
        if (bankOpt.isPresent()) return bankOpt.get().getUser();

        // 3. Strip @... handle if present (e.g. utkarsh1201@finova -> utkarsh1201)
        if (query.contains("@")) {
            String stripped = query.split("@")[0].trim();
            Optional<User> strippedOpt = userRepository.findByUsernameOrEmailOrPhoneNumber(stripped, stripped, stripped);
            if (strippedOpt.isPresent()) return strippedOpt.get();
        }

        // 4. Default fallback: match sender user if prefix matches
        if (query.equalsIgnoreCase(senderUser.getUsername()) || query.toLowerCase().startsWith(senderUser.getUsername().toLowerCase())) {
            return senderUser;
        }

        // 5. Search substring match
        List<User> matches = userRepository.findAll().stream()
                .filter(u -> u.getUsername().toLowerCase().contains(query.toLowerCase()) || query.toLowerCase().contains(u.getUsername().toLowerCase()))
                .collect(Collectors.toList());
        if (!matches.isEmpty()) return matches.get(0);

        // Fallback to senderUser for external UPI handling
        return senderUser;
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
