package com.finova.repository;

import com.finova.entity.BankAccount;
import com.finova.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    List<BankAccount> findByUser(User user);

    List<BankAccount> findByUserId(Long userId);

    Optional<BankAccount> findByUpiId(String upiId);

    Optional<BankAccount> findByUserIdAndIsPrimaryTrue(Long userId);

    boolean existsByUpiId(String upiId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM BankAccount b WHERE b.id = :id")
    Optional<BankAccount> findByIdForUpdate(@Param("id") Long id);
}
