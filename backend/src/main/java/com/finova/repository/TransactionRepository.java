package com.finova.repository;

import com.finova.entity.Transaction;
import com.finova.entity.TransactionStatus;
import com.finova.entity.Wallet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionReference(String transactionReference);

    Page<Transaction> findBySenderWalletOrReceiverWalletOrderByCreatedAtDesc(
            Wallet senderWallet, Wallet receiverWallet, Pageable pageable);

    List<Transaction> findTop5BySenderWalletOrReceiverWalletOrderByCreatedAtDesc(
            Wallet senderWallet, Wallet receiverWallet);

    @Query("SELECT t FROM Transaction t WHERE (t.senderWallet.id = :walletId OR t.receiverWallet.id = :walletId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:startDate IS NULL OR t.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR t.createdAt <= :endDate) " +
           "AND (:minAmount IS NULL OR t.amount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR t.amount <= :maxAmount) " +
           "ORDER BY t.createdAt DESC")
    Page<Transaction> filterTransactions(
            @Param("walletId") Long walletId,
            @Param("status") TransactionStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("minAmount") BigDecimal minAmount,
            @Param("maxAmount") BigDecimal maxAmount,
            Pageable pageable);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.senderWallet.user.id = :userId AND t.createdAt >= :since")
    long countRecentTransactionsByUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT AVG(t.amount) FROM Transaction t WHERE t.senderWallet.user.id = :userId AND t.status = 'SUCCESS'")
    BigDecimal calculateAverageTransactionAmountByUser(@Param("userId") Long userId);
}
