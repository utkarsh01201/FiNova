package com.finova.service.impl;

import com.finova.dto.GameSpinRequest;
import com.finova.dto.GameSpinResult;
import com.finova.entity.*;
import com.finova.exception.BadRequestException;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.TransactionRepository;
import com.finova.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Random;
import java.util.UUID;

@Service
public class GameService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    /**
     * Wheel segments matching frontend SEGMENTS array (index 0-7).
     * Fields: [label, multiplier]
     * Multiplier 0.0 = LOSS
     */
    private static final String[] LABELS = {
        "2x Win", "LOSE", "1.5x Win", "LOSE", "3x Win", "LOSE", "JACKPOT 10x", "LOSE"
    };
    private static final double[] MULTIPLIERS = {
        2.0, 0.0, 1.5, 0.0, 3.0, 0.0, 10.0, 0.0
    };

    // Probability weights for 8 segments (sum = 100)
    // 2x=20%, LOSE=20%, 1.5x=15%, LOSE=15%, 3x=7%, LOSE=10%, JACKPOT=3%, LOSE=10%
    private static final int[] WEIGHTS = { 20, 20, 15, 15, 7, 10, 3, 10 };

    @Transactional
    public GameSpinResult spin(Long userId, GameSpinRequest request) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));

        if (wallet.getStatus() != WalletStatus.ACTIVE) {
            throw new BadRequestException("Wallet is not active");
        }

        BigDecimal bet = request.getBetAmount().setScale(2, RoundingMode.HALF_UP);
        if (bet.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Bet amount must be greater than zero");
        }
        if (wallet.getBalance().compareTo(bet) < 0) {
            throw new BadRequestException("Insufficient wallet balance! Available: ₹" + wallet.getBalance());
        }

        // Pick random weighted segment
        int segmentIndex = pickWeightedRandom();
        String segmentLabel = LABELS[segmentIndex];
        double multiplier = MULTIPLIERS[segmentIndex];
        boolean isWin = multiplier > 0.0;

        BigDecimal winAmount = isWin
                ? bet.multiply(BigDecimal.valueOf(multiplier)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Update wallet atomically
        // Always deduct the bet first
        wallet.setBalance(wallet.getBalance().subtract(bet));
        // Then add winnings if won
        if (isWin) {
            wallet.setBalance(wallet.getBalance().add(winAmount));
        }
        walletRepository.save(wallet);

        // Build description
        String desc = isWin
                ? String.format("Lucky Spin WIN! %s - Bet Rs%.2f Won Rs%.2f", segmentLabel, bet, winAmount)
                : String.format("Lucky Spin LOSS - Bet Rs%.2f lost", bet);

        // Record transaction — always use senderWallet=wallet (the user's wallet is always involved)
        Transaction tx = Transaction.builder()
                .transactionReference(UUID.randomUUID().toString())
                .senderWallet(wallet)
                .receiverWallet(null)
                .senderBankAccountId(null)
                .receiverBankAccountId(null)
                .amount(bet)
                .type(isWin ? TransactionType.GAME_WIN : TransactionType.GAME_LOSS)
                .status(TransactionStatus.SUCCESS)
                .description(desc)
                .paymentMethod("GAME")
                .upiId(null)
                .fraudRiskScore(0.0)
                .fraudRiskLevel("LOW")
                .build();

        Transaction savedTx = transactionRepository.save(tx);

        String message = isWin
                ? String.format("You WON Rs%.2f! (%s)", winAmount, segmentLabel)
                : String.format("You lost Rs%.2f. Better luck next spin!", bet);

        return GameSpinResult.builder()
                .outcome(isWin ? "WIN" : "LOSS")
                .segment(segmentLabel)
                .multiplier(multiplier)
                .betAmount(bet)
                .winAmount(winAmount)
                .newBalance(wallet.getBalance())
                .message(message)
                .transactionId(savedTx.getId())
                .spinIndex(segmentIndex)
                .build();
    }

    private int pickWeightedRandom() {
        int total = 0;
        for (int w : WEIGHTS) total += w;
        int rand = new Random().nextInt(total);
        int cumulative = 0;
        for (int i = 0; i < WEIGHTS.length; i++) {
            cumulative += WEIGHTS[i];
            if (rand < cumulative) return i;
        }
        return WEIGHTS.length - 1;
    }
}
