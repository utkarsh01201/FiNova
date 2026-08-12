package com.finova.service.impl;

import com.finova.dto.*;
import com.finova.entity.*;
import com.finova.exception.BadRequestException;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.BankAccountRepository;
import com.finova.repository.TransactionRepository;
import com.finova.repository.UserRepository;
import com.finova.repository.WalletRepository;
import com.finova.service.BankAccountService;
import com.finova.service.FraudDetectionClientService;
import com.finova.service.NotificationService;
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
public class BankAccountServiceImpl implements BankAccountService {

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private FraudDetectionClientService fraudDetectionClientService;

    @Override
    @Transactional
    public BankAccountDto linkBankAccount(Long userId, LinkBankRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String upiId = request.getUpiId().toLowerCase().trim();
        if (!upiId.contains("@")) {
            upiId = upiId + "@finova";
        }

        if (bankAccountRepository.existsByUpiId(upiId)) {
            throw new BadRequestException("UPI ID '" + upiId + "' is already registered");
        }

        List<BankAccount> existingAccounts = bankAccountRepository.findByUser(user);
        boolean isFirstAccount = existingAccounts.isEmpty();

        BankAccount bankAccount = BankAccount.builder()
                .user(user)
                .bankName(request.getBankName())
                .accountNumber(request.getAccountNumber())
                .ifscCode(request.getIfscCode().toUpperCase())
                .accountHolderName(request.getAccountHolderName())
                .upiId(upiId)
                .upiPinHash(passwordEncoder.encode(request.getUpiPin()))
                .balance(new BigDecimal("50000.00")) // Initial linked bank balance
                .isPrimary(isFirstAccount)
                .status("ACTIVE")
                .build();

        BankAccount saved = bankAccountRepository.save(bankAccount);

        notificationService.sendNotification(user, "Bank Account Linked",
                String.format("Linked %s (Account: %s) with UPI ID %s.",
                        request.getBankName(), maskAccountNumber(request.getAccountNumber()), upiId),
                NotificationType.SYSTEM);

        return mapToDto(saved, false);
    }

    @Override
    public List<BankAccountDto> getUserBankAccounts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return bankAccountRepository.findByUser(user).stream()
                .map(acc -> mapToDto(acc, false))
                .collect(Collectors.toList());
    }

    @Override
    public BankAccountDto checkBalanceWithUpiPin(Long userId, CheckBalanceRequest request) {
        BankAccount bankAccount = bankAccountRepository.findById(request.getBankAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", request.getBankAccountId()));

        if (!bankAccount.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to bank account");
        }

        // Verify UPI PIN
        if (!passwordEncoder.matches(request.getUpiPin(), bankAccount.getUpiPinHash())) {
            throw new BadRequestException("Incorrect UPI PIN provided! Balance request rejected.");
        }

        return mapToDto(bankAccount, true);
    }

    @Override
    @Transactional
    public BankAccountDto setPrimaryBankAccount(Long userId, Long bankAccountId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<BankAccount> accounts = bankAccountRepository.findByUser(user);
        BankAccount targetAccount = null;

        for (BankAccount acc : accounts) {
            if (acc.getId().equals(bankAccountId)) {
                acc.setIsPrimary(true);
                targetAccount = acc;
            } else {
                acc.setIsPrimary(false);
            }
        }

        if (targetAccount == null) {
            throw new ResourceNotFoundException("BankAccount", "id", bankAccountId);
        }

        bankAccountRepository.saveAll(accounts);
        return mapToDto(targetAccount, false);
    }

    @Override
    @Transactional
    public TransactionDto sendMoneyViaUpi(Long userId, UpiSendMoneyRequest request) {
        User senderUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Lock Source Bank Account
        BankAccount senderBank = bankAccountRepository.findByIdForUpdate(request.getBankAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", request.getBankAccountId()));

        if (!senderBank.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized bank account selection");
        }

        // Verify Secret UPI PIN
        if (!passwordEncoder.matches(request.getUpiPin(), senderBank.getUpiPinHash())) {
            throw new BadRequestException("Incorrect UPI PIN! Transaction cancelled.");
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid transfer amount");
        }

        if (senderBank.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient bank balance! Available: ₹" + senderBank.getBalance());
        }

        // Resolve Recipient (via UPI ID, Phone Number, or Username)
        String recipientId = request.getRecipientUpiOrIdentifier().trim();
        Optional<BankAccount> receiverBankOpt = bankAccountRepository.findByUpiId(recipientId);

        User receiverUser;
        BankAccount receiverBank = null;

        if (receiverBankOpt.isPresent()) {
            receiverBank = receiverBankOpt.get();
            receiverUser = receiverBank.getUser();
        } else {
            // Strip @... handle if present (e.g. utkarsh1201@finova -> utkarsh1201)
            String lookupKey = recipientId.contains("@") ? recipientId.split("@")[0].trim() : recipientId;
            Optional<User> foundOpt = userRepository.findByUsernameOrEmailOrPhoneNumber(lookupKey, lookupKey, lookupKey);

            if (foundOpt.isPresent()) {
                receiverUser = foundOpt.get();
            } else {
                receiverUser = senderUser; // Fallback to senderUser for external UPI handling
            }
            
            Optional<BankAccount> primaryOpt = bankAccountRepository.findByUserIdAndIsPrimaryTrue(receiverUser.getId());
            if (primaryOpt.isPresent()) {
                receiverBank = primaryOpt.get();
            }
        }

        // Fraud Assessment
        FraudAssessmentResponse fraudRisk = fraudDetectionClientService.evaluateTransactionRisk(senderUser, receiverUser, amount);
        if ("BLOCK".equalsIgnoreCase(fraudRisk.getDecision())) {
            Transaction blockedTx = Transaction.builder()
                    .transactionReference(UUID.randomUUID().toString())
                    .senderBankAccountId(senderBank.getId())
                    .paymentMethod("BANK_UPI")
                    .upiId(senderBank.getUpiId())
                    .amount(amount)
                    .type(TransactionType.UPI_PAYMENT)
                    .status(TransactionStatus.BLOCKED)
                    .description("Blocked by Finova AI Security Engine")
                    .fraudRiskScore(fraudRisk.getRiskScore())
                    .fraudRiskLevel(fraudRisk.getRiskLevel())
                    .build();

            transactionRepository.save(blockedTx);
            throw new BadRequestException("UPI Transfer blocked by AI Security due to suspicious activity score.");
        }

        // Deduct from Sender Bank Account
        senderBank.setBalance(senderBank.getBalance().subtract(amount));
        bankAccountRepository.save(senderBank);

        // Credit Recipient Bank Account (or Wallet if no bank linked)
        Wallet receiverWallet = null;
        if (receiverBank != null) {
            receiverBank.setBalance(receiverBank.getBalance().add(amount));
            bankAccountRepository.save(receiverBank);
        } else {
            receiverWallet = walletRepository.findByUserIdForUpdate(receiverUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", receiverUser.getId()));
            receiverWallet.setBalance(receiverWallet.getBalance().add(amount));
            walletRepository.save(receiverWallet);
        }

        String desc = request.getDescription() != null && !request.getDescription().isBlank() ?
                request.getDescription() : "UPI Payment via " + senderBank.getBankName();

        Transaction transaction = Transaction.builder()
                .transactionReference(UUID.randomUUID().toString())
                .senderBankAccountId(senderBank.getId())
                .receiverBankAccountId(receiverBank != null ? receiverBank.getId() : null)
                .receiverWallet(receiverWallet)
                .paymentMethod("BANK_UPI")
                .upiId(senderBank.getUpiId())
                .amount(amount)
                .type(TransactionType.UPI_PAYMENT)
                .status(TransactionStatus.SUCCESS)
                .description(desc)
                .fraudRiskScore(fraudRisk.getRiskScore())
                .fraudRiskLevel(fraudRisk.getRiskLevel())
                .build();

        Transaction savedTx = transactionRepository.save(transaction);

        // Notifications
        notificationService.sendNotification(senderUser, "UPI Transfer Sent",
                String.format("₹%.2f sent to %s via UPI.", amount, receiverUser.getFullName()), NotificationType.TRANSACTION);

        notificationService.sendNotification(receiverUser, "UPI Money Received",
                String.format("You received ₹%.2f from %s (%s).", amount, senderUser.getFullName(), senderBank.getUpiId()), NotificationType.TRANSACTION);

        return mapToTransactionDto(savedTx, senderUser, receiverUser);
    }

    private String maskAccountNumber(String acc) {
        if (acc == null || acc.length() < 4) return "••••";
        return "••••" + acc.substring(acc.length() - 4);
    }

    private BankAccountDto mapToDto(BankAccount acc, boolean includeBalance) {
        return BankAccountDto.builder()
                .id(acc.getId())
                .userId(acc.getUser().getId())
                .bankName(acc.getBankName())
                .accountNumberMasked(maskAccountNumber(acc.getAccountNumber()))
                .ifscCode(acc.getIfscCode())
                .accountHolderName(acc.getAccountHolderName())
                .upiId(acc.getUpiId())
                .balance(includeBalance ? acc.getBalance() : null)
                .isPrimary(acc.getIsPrimary())
                .status(acc.getStatus())
                .createdAt(acc.getCreatedAt())
                .build();
    }

    private TransactionDto mapToTransactionDto(Transaction tx, User sender, User receiver) {
        return TransactionDto.builder()
                .id(tx.getId())
                .transactionReference(tx.getTransactionReference())
                .senderUsername(sender.getUsername())
                .senderFullName(sender.getFullName())
                .receiverUsername(receiver.getUsername())
                .receiverFullName(receiver.getFullName())
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
