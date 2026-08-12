package com.finova.repository;

import com.finova.entity.MoneyRequest;
import com.finova.entity.RequestStatus;
import com.finova.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MoneyRequestRepository extends JpaRepository<MoneyRequest, Long> {

    Optional<MoneyRequest> findByRequestReference(String requestReference);

    Page<MoneyRequest> findByRequesterOrderByCreatedAtDesc(User requester, Pageable pageable);

    Page<MoneyRequest> findByPayerOrderByCreatedAtDesc(User payer, Pageable pageable);

    Page<MoneyRequest> findByPayerAndStatusOrderByCreatedAtDesc(User payer, RequestStatus status, Pageable pageable);

    @Query("SELECT r FROM MoneyRequest r WHERE (r.requester.id = :userId OR r.payer.id = :userId) " +
           "AND (:status IS NULL OR r.status = :status) ORDER BY r.createdAt DESC")
    Page<MoneyRequest> findAllUserRequests(@Param("userId") Long userId, @Param("status") RequestStatus status, Pageable pageable);

    List<MoneyRequest> findTop5ByPayerAndStatusOrderByCreatedAtDesc(User payer, RequestStatus status);
}
